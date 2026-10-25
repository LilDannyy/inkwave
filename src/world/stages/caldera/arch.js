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
import { LAYOUT, OFFICE } from './layout.js';

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

      // Heavy brick facade courses along front wall (z = z0 - 0.25)
      pbox(B, 'paint', K.brick, w, h, 0.45, mx, h / 2, z0 - 0.25);
      // Dark plinth foundation
      pbox(B, 'paint', K.brickDk, w + 0.2, 1.4, 0.6, mx, 0.7, z0 - 0.32);
      // Cornice band at roof line
      pbox(B, 'paint', K.brickDk, w + 0.3, 0.5, 0.65, mx, h - 0.25, z0 - 0.35);

      // Structural iron vertical pilasters every 4.5 m
      const nP = Math.floor(w / 4.5);
      for (let i = 0; i <= nP; i++) {
        const px = xw + (w * i) / nP;
        pbox(B, 'metal', K.iron, 0.38, h, 0.52, px, h / 2, z0 - 0.28);
        // Base plate and capital
        pbox(B, NS('metal'), K.ironDk, 0.5, 0.35, 0.6, px, 0.18, z0 - 0.32);
        pbox(B, NS('metal'), K.ironDk, 0.5, 0.35, 0.6, px, h - 0.18, z0 - 0.32);
        // Rivet rows
        rivets(B, [px - 0.14, 0.6, z0 - 0.02], [px - 0.14, h - 0.6, z0 - 0.02], 18);
        rivets(B, [px + 0.14, 0.6, z0 - 0.02], [px + 0.14, h - 0.6, z0 - 0.02], 18);
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
          ptor(B, NS('metal'), K.iron, 1.42, 0.06, cx, rY, cz, { rx: HP });
        }
        // Corbelled crown and spark arrestor cap
        pcyl(B, 'metal', K.ironDk, 1.65, 0.6, cx, h + chH + 0.3, cz, { seg: 16 });
        pcyl(B, NS('metal'), K.iron, 0.9, 0.8, cx, h + chH + 0.8, cz, { seg: 12 });
        // Ladder rungs on chimney face
        for (let lY = h + 1.0; lY < h + chH - 0.5; lY += 0.6) {
          pbox(B, NS('metal'), K.ironLt, 0.45, 0.04, 0.04, cx, lY, cz + 1.46);
        }
      }

      // Heavy Sliding Bay Doors at ground level (flush against wall behind z0 - 0.1)
      for (const dx of [mx - 6.5, mx + 6.5]) {
        // Door opening surround
        pbox(B, 'metal', K.iron, 3.6, 4.2, 0.35, dx, 2.1, z0 - 0.28);
        // Slotted iron bay door with hazard stripes
        pbox(B, 'metal', K.ironDk, 3.2, 3.8, 0.14, dx, 1.95, z0 - 0.22);
        pbox(B, NS('paint'), K.gold, 3.2, 0.25, 0.16, dx, 1.0, z0 - 0.20);
        pbox(B, NS('paint'), K.gold, 3.2, 0.25, 0.16, dx, 2.6, z0 - 0.20);
        // Top roller track
        pbox(B, NS('metal'), K.ironLt, 4.0, 0.18, 0.22, dx, 3.95, z0 - 0.18);
      }

      // Overhead Jib Crane Runway mounted high on the facade (y = 11.2, clear of gallery)
      pbox(B, 'metal', K.greenDk, 0.4, 0.6, 1.2, mx, 11.2, z0 + 0.2);
      // Crane trolley and forged hook (mounted high at y = 10.6, well above 6.6 m player reach)
      pbox(B, 'metal', K.iron, 0.6, 0.4, 0.6, mx, 10.8, z0 + 0.3);
      pcyl(B, NS('metal'), K.ironLt, 0.03, 0.6, mx, 10.3, z0 + 0.3);
      ptor(B, 'metal', K.ironDk, 0.22, 0.06, mx, 9.9, z0 + 0.3, { rx: HP });

      // Wall Gooseneck Lamps along the hall facade (mounted high at y = 7.4, well above 6.6 m player reach)
      for (const lx of [xw + 3.0, mx - 4.5, mx + 4.5, xe - 3.0]) {
        industrialLamp(B, lx, 7.4, z0 + 0.05, 0);
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

      // Stone plinth foundation (within 4 cm of face)
      pbox(B, 'paint', K.basaltDk, w + 0.06, 0.6, d + 0.06, cx, y0 + 0.3, cz);

      // Crisp dark green corner trims and baseboard (within 3 cm of face)
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        pbox(B, NS('paint'), K.greenDk, 0.08, h, 0.08, cx + sx * (w / 2 - 0.02), y0 + h / 2, cz + sz * (d / 2 - 0.02));
      }
      pbox(B, NS('paint'), K.greenDk, w + 0.05, 0.2, d + 0.05, cx, y0 + 0.7, cz);
      pbox(B, NS('paint'), K.greenDk, w + 0.05, 0.22, d + 0.05, cx, y0 + h - 0.1, cz);

      // Multi-pane sash windows on lakefront face (+Z) and causeway face (+X) (flush within 5 cm)
      // Lakefront Windows (+Z face, cz + d / 2)
      for (const wx of [-1.3, 1.3]) {
        const wy = y0 + 2.5;
        // Window casing frame
        pbox(B, 'paint', K.greenDk, 1.4, 1.8, 0.04, cx + wx, wy, cz + d / 2 + 0.02);
        pbox(B, 'paint', K.white, 1.2, 1.6, 0.03, cx + wx, wy, cz + d / 2 + 0.03);
        // Illuminated interior glass
        pbox(B, 'glow', K.glassLit, 1.1, 1.5, 0.02, cx + wx, wy, cz + d / 2 + 0.035, { glow: 1.6 });
        // Timber glazing bars
        pbox(B, NS('paint'), K.greenDk, 1.1, 0.04, 0.02, cx + wx, wy, cz + d / 2 + 0.04);
        pbox(B, NS('paint'), K.greenDk, 0.04, 1.5, 0.02, cx + wx, wy, cz + d / 2 + 0.04);
        // Window sill
        pbox(B, NS('paint'), K.greenDk, 1.5, 0.1, 0.06, cx + wx, wy - 0.85, cz + d / 2 + 0.03);
      }

      // Causeway Window (+X face, cx + w / 2)
      {
        const wy = y0 + 2.5;
        pbox(B, 'paint', K.greenDk, 0.04, 1.8, 1.4, cx + w / 2 + 0.02, wy, cz);
        pbox(B, 'glow', K.glassLit, 0.02, 1.5, 1.1, cx + w / 2 + 0.03, wy, cz, { glow: 1.6 });
        pbox(B, NS('paint'), K.greenDk, 0.02, 0.04, 1.1, cx + w / 2 + 0.04, wy, cz);
        pbox(B, NS('paint'), K.greenDk, 0.02, 1.5, 0.04, cx + w / 2 + 0.04, wy, cz);
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

      // Panelled Entrance Door on East (+X) face (flush within 4 cm of face)
      {
        const dy = y0 + 1.8, dz = cz + 1.3;
        // Door surround
        pbox(B, 'paint', K.greenDk, 0.04, 2.4, 1.2, cx + w / 2 + 0.02, dy, dz);
        // Panelled door body
        pbox(B, 'wood', K.woodDk, 0.02, 2.2, 1.0, cx + w / 2 + 0.03, dy - 0.1, dz);
        // Brass handle & kickplate
        pbox(B, NS('metal'), K.brass, 0.02, 0.08, 0.04, cx + w / 2 + 0.04, dy - 0.1, dz + 0.35);
        pbox(B, NS('metal'), K.brass, 0.02, 0.25, 0.9, cx + w / 2 + 0.035, y0 + 0.72, dz);
        // Transom window with SURGE CONTROLLER lettering
        pbox(B, 'glow', K.glassLit, 0.02, 0.4, 0.9, cx + w / 2 + 0.035, dy + 1.05, dz, { glow: 1.2 });
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
    desc: 'The Great Surge Gauge: 22 m riveted lattice tower, upper copper float-well, illuminated tidal surge sight glass, brass bell cage',
    build(B) {
      const topH = 22.0;
      // 4 piers in cyclic perimeter order (no diagonal crossing!)
      const piers = [[4.2, 1.75], [-4.2, 1.75], [-4.2, -1.75], [4.2, -1.75]];

      // 4 Foundation Pier Collars on the real layout piers (px = +-4.2, pz = +-1.75, width 1.2x1.2, y = 1.8 to 7.0)
      for (const [px, pz] of piers) {
        const sx = Math.sign(px), sz = Math.sign(pz);
        // Collars offset slightly outward so they stand 4 cm proud on outer faces and stop 2 cm before inner faces (0 m² coplanar, 0 in mid)
        const colW = 1.22, colD = 1.22;
        const colX = px + sx * 0.03, colZ = pz + sz * 0.03;
        // Cast-iron plinth collar at pier base (y = 1.8 to 2.5)
        pbox(B, 'metal', K.ironDk, colW, 0.7, colD, colX, 2.15, colZ);
        pbox(B, NS('metal'), K.ironLt, colW + 0.02, 0.08, colD + 0.02, colX, 2.46, colZ);
        // Corner angle irons running up the four corners of the pier
        for (const cx of [-0.54, 0.56]) {
          for (const cz of [-0.54, 0.56]) {
            pbox(B, NS('metal'), K.iron, 0.05, 4.4, 0.05, px + sx * cx, 4.6, pz + sz * cz);
          }
        }
        // Capital collar below tie girders / pier top (y = 6.6 to 7.0)
        pbox(B, 'metal', K.ironDk, colW, 0.4, colD, colX, 6.8, colZ);
      }

      // Tie girder trim (y = 6.0 to 6.9, z = +-1.75)
      for (const sz of [-1, 1]) {
        pbox(B, 'metal', K.greenDk, 9.6, 0.12, 0.44, 0, 6.06, sz * 1.75);
        pbox(B, 'metal', K.greenDk, 9.6, 0.12, 0.44, 0, 6.84, sz * 1.75);
      }

      // Upper Polished Copper Float-Well (strictly above y = 7.2 m inside gauge works box; 0 below 7.0!)
      pcyl(B, 'metal', K.copper, 1.1, 5.4, 0, 10.1, 0, { seg: 16 });
      for (let y = 8.0; y <= 12.5; y += 1.5) {
        ptor(B, NS('metal'), K.brass, 1.14, 0.04, 0, y, 0, { rx: HP });
      }

      // Riveted Lattice Tower: 4 Corner Main Chords starting at pier tops (strictly y >= 7.2 m)
      for (const [px, pz] of piers) {
        const tx = Math.sign(px) * 1.2, tz = Math.sign(pz) * 1.2;
        strut(B, 'metal', K.greenDk, [px, 7.2, pz], [tx, topH, tz], 0.22);
      }

      // Horizontal Ring Girders & Diagonal X-Bracing strictly from y = 7.2 to topH = 22.0
      const rings = [7.2, 9.5, 12.5, 15.5, 18.5, 20.0];
      for (let ri = 0; ri < rings.length; ri++) {
        const y = rings[ri];
        const u = (y - 7.2) / (topH - 7.2);
        const p = piers.map(([px, pz]) => [
          px + (Math.sign(px) * 1.2 - px) * u,
          pz + (Math.sign(pz) * 1.2 - pz) * u,
        ]);
        // Perimeter ring struts (in cyclic order around perimeter, zero cross-pond intrusion)
        for (let k = 0; k < 4; k++) {
          const kNext = (k + 1) % 4;
          strut(B, 'metal', K.green, [p[k][0], y, p[k][1]], [p[kNext][0], y, p[kNext][1]], 0.16);
          // Diagonal X-bracing between tiers
          if (ri > 0) {
            const yPrev = rings[ri - 1];
            const uPrev = (yPrev - 7.2) / (topH - 7.2);
            const pPrev = piers.map(([px, pz]) => [
              px + (Math.sign(px) * 1.2 - px) * uPrev,
              pz + (Math.sign(pz) * 1.2 - pz) * uPrev,
            ]);
            strut(B, NS('metal'), K.greenDk, [p[k][0], y, p[k][1]], [p[kNext][0], yPrev, p[kNext][1]], 0.08);
            strut(B, NS('metal'), K.greenDk, [p[kNext][0], y, p[kNext][1]], [p[k][0], yPrev, p[k][1]], 0.08);
          }
        }
      }

      // Industrial Vertical Tidal Surge Sight Scale (facing +-Z at y = 14.5; NOT a clock/face!)
      const dialY = 14.5;
      for (const s of [-1, 1]) {
        B.push(0, dialY, s * 1.35, s < 0 ? PI : 0);
        // Heavy cast-iron and brass rectangular housing
        pbox(B, 'metal', K.ironDk, 2.6, 5.0, 0.35, 0, 0, 0);
        pbox(B, NS('metal'), K.brass, 2.4, 4.8, 0.38, 0, 0, 0);
        // Vertical illuminated surge scale (lower green, mid amber, top red)
        pbox(B, 'glow', '#2ecc71', 1.0, 1.3, 0.06, 0, -1.4, 0.21, { glow: 1.5 });
        pbox(B, 'glow', '#f39c12', 1.0, 1.3, 0.06, 0, 0.0, 0.21, { glow: 1.8 });
        pbox(B, 'glow', '#e74c3c', 1.0, 1.3, 0.06, 0, 1.4, 0.21, { glow: 2.2 });
        // Heavy horizontal bronze indicator cursor
        pbox(B, 'metal', K.brass, 1.5, 0.14, 0.14, 0, 0.1, 0.26);
        // Calibration scale tick marks
        for (let ty = -1.8; ty <= 1.8; ty += 0.4) {
          pbox(B, NS('metal'), K.ironLt, 0.25, 0.04, 0.08, -0.7, ty, 0.22);
          pbox(B, NS('metal'), K.ironLt, 0.25, 0.04, 0.08, 0.7, ty, 0.22);
        }
        B.pop();
      }

      // Bell Cage at the Tower Summit (y = 20.0 to 22.5 m)
      pcyl(B, 'metal', K.ironDk, 1.4, 0.35, 0, 20.0, 0, { seg: 12 });
      for (let k = 0; k < 6; k++) {
        const a = k * (PI / 3);
        pcyl(B, NS('metal'), K.green, 0.06, 2.2, Math.cos(a) * 1.05, 21.1, Math.sin(a) * 1.05);
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
  // (Ladle stand, ladle car, pig bed, flask stack, floor drain, hornito defined in props.js)

  // =========================================================================================================
  // 7. THE RIM HEAD & WINCH HOUSE (South Slump head)
  // Corrugated iron machinery shed, double doors, windows, twin wire-rope winding drums (fitting 2.4 x 2.4 m block)
  // =========================================================================================================
  D.caldera_winch_house = {
    desc: 'The Rim Head Winch House: machinery shed, twin winding drums, spooled wire cables, headframe sheaves',
    build(B) {
      const w = 2.42, d = 2.42, h = 2.76;

      // Dressed basalt masonry foundation trim
      pbox(B, 'paint', K.basaltDk, w + 0.04, 0.3, d + 0.04, 0, 0.15, 0);

      // Dark green structural angle corner trims
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        pbox(B, NS('metal'), K.greenDk, 0.12, h, 0.12, sx * (w / 2 - 0.04), h / 2, sz * (d / 2 - 0.04));
      }

      // Pitched Corrugated Iron Roof with ridge ventilator (overhang <= 6 cm)
      B.push(0, h, 0);
      pbox(B, 'metal', K.verd, w + 0.12, 0.14, d + 0.12, 0, 0.25, 0, { rx: -0.25 });
      pcyl(B, NS('metal'), K.iron, 0.16, 0.6, 0, 0.6, 0, { seg: 8 });
      B.pop();

      // Double Corrugated Sliding Equipment Doors on front (+Z face, within 5 cm)
      pbox(B, 'metal', K.greenDk, 1.8, 2.2, 0.06, 0, 1.2, d / 2 + 0.03);
      pbox(B, NS('metal'), K.ironLt, 2.0, 0.1, 0.08, 0, 2.35, d / 2 + 0.04); // Top roller track

      // Multi-pane factory window on side (+X face, within 5 cm)
      pbox(B, 'paint', K.greenDk, 0.06, 1.2, 1.2, w / 2 + 0.03, 1.6, 0);
      pbox(B, 'glow', K.glassLit, 0.04, 1.0, 1.0, w / 2 + 0.04, 1.6, 0, { glow: 1.4 });

      // Compact cable winding drums mounted flush against the wall face (+Z, within 5 cm)
      B.push(0, 0.5, d / 2 + 0.02);
      pbox(B, 'metal', K.ironDk, 1.6, 0.3, 0.04, 0, 0.15, 0);
      for (const dx of [-0.45, 0.45]) {
        pcyl(B, 'metal', K.iron, 0.22, 0.06, dx, 0.35, 0.02, { rx: HP, seg: 12 });
      }
      B.pop();
    },
  };

  // =========================================================================================================
  // 8. ORGAN PIPES DRESSING (Moved to dynamic rider mesh inside src/fx/lavaFx.js so dressing dynamically tracks riders!)
  // =========================================================================================================


  // =========================================================================================================
  // 10. POUR FLOOR PLINTH & FOUNDRY SURROUND DRESSING
  // Riveted cast-iron plinth skirts on all 4 faces (x = ±5.04, z = ±5.04), pier boots, cooling racks, tongs
  // =========================================================================================================
  D.caldera_pour_floor_dressing = {
    desc: 'Heavy cast-iron plinth skirting, pier boots, ingot cooling racks, and tongs racks for Pour Floor',
    build(B) {
      // 1. Plinth skirting panels along the 4 vertical faces of [-5, 5] x [1.2, 1.8] x [-5, 5] (within 6 cm of face)
      // North & South faces (z = ±5.02 m, span x: -5 to +5 m, y: 1.2 to 1.8 m)
      for (const sz of [-1, 1]) {
        const pz = sz * 5.02;
        // Iron base flange at floor line
        pbox(B, NS('metal'), K.ironDk, 10.08, 0.08, 0.04, 0, 1.24, pz);
        // Angle iron coping with yellow hazard strip along top lip
        pbox(B, 'metal', K.iron, 10.08, 0.06, 0.04, 0, 1.78, pz);
        pbox(B, NS('paint'), K.gold, 10.06, 0.04, 0.05, 0, 1.75, pz);
        // Vertical stiffener ribs every 1.25 m
        for (let x = -4.5; x <= 4.5; x += 1.25) {
          pbox(B, 'metal', K.ironLt, 0.12, 0.5, 0.04, x, 1.5, pz + sz * 0.01);
          // Rivets on stiffener
          psph(B, NS('metal'), K.ironDk, 0.015, x, 1.35, pz + sz * 0.025);
          psph(B, NS('metal'), K.ironDk, 0.015, x, 1.65, pz + sz * 0.025);
        }
        // Base drainage slots
        for (let x = -3.8; x <= 3.8; x += 2.5) {
          pbox(B, NS('metal'), K.ironDk, 0.35, 0.08, 0.04, x, 1.25, pz);
        }
      }
      // East & West faces (x = ±5.02 m, span z: -5 to +5 m, y: 1.2 to 1.8 m)
      for (const sx of [-1, 1]) {
        const px = sx * 5.02;
        // Iron base flange at floor line
        pbox(B, NS('metal'), K.ironDk, 0.04, 0.08, 10.08, px, 1.24, 0);
        // Angle iron coping with yellow hazard strip
        pbox(B, 'metal', K.iron, 0.04, 0.06, 10.08, px, 1.78, 0);
        pbox(B, NS('paint'), K.gold, 0.05, 0.04, 10.06, px, 1.75, 0);
        // Vertical stiffener ribs every 1.25 m
        for (let z = -4.5; z <= 4.5; z += 1.25) {
          pbox(B, 'metal', K.ironLt, 0.04, 0.5, 0.12, px + sx * 0.01, 1.5, z);
          psph(B, NS('metal'), K.ironDk, 0.015, px + sx * 0.025, 1.35, z);
          psph(B, NS('metal'), K.ironDk, 0.015, px + sx * 0.025, 1.65, z);
        }
      }
      // Cast-iron corner brackets (within 4 cm of faces)
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        pbox(B, 'metal', K.ironDk, 0.06, 0.58, 0.06, sx * 5.01, 1.5, sz * 5.01);
      }

      // 2. Wall-Mounted Ingot Cooling Stills (flush against plinth vertical faces, within 6 cm)
      for (const sx of [-1, 1]) {
        const px = sx * 5.02;
        pbox(B, 'metal', K.ironDk, 0.04, 0.4, 2.4, px, 1.5, 0);
        for (let iz = -0.9; iz <= 0.9; iz += 0.45) {
          pbox(B, 'metal', '#383430', 0.04, 0.12, 0.32, px + sx * 0.02, 1.5, iz, { r: 0.02 });
          pbox(B, 'glow', K.lavaGlow, 0.03, 0.04, 0.28, px + sx * 0.025, 1.5, iz, { glow: 1.4 });
        }
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

      // Stilling Drum at [7.6, 1.2, -6.3] (OCT r = 1.0, h = 1.4, within 4 cm of face)
      B.push(7.6, 1.2, -6.3);
      pcyl(B, 'metal', K.ironDk, 0.94, 1.36, 0, 0.68, 0, { seg: 16 });
      for (const hy of [0.25, 0.7, 1.15]) {
        ptor(B, NS('metal'), K.ironLt, 0.95, 0.015, 0, hy, 0, { rx: HP });
      }
      // Bolted inspection manway on side
      pcyl(B, NS('metal'), K.iron, 0.18, 0.04, 0.92, 0.7, 0, { rz: HP });
      // Brass pressure relief valve and gauge (stays within 8 cm of drum top)
      pcyl(B, NS('metal'), K.brass, 0.05, 0.06, 0, 1.41, 0.3);
      psph(B, NS('metal'), K.brass, 0.03, 0, 1.45, 0.3);
      B.pop();

      // Ladle Stand at [11.6, 1.2, 0.8] (1.4 x 1.8 x 1.4, within 4 cm of faces, h <= 1.4 m)
      B.push(11.6, 1.2, 0.8);
      // Steel cradle frame
      for (const sx of [-0.68, 0.68]) {
        strut(B, 'metal', K.greenDk, [sx, 0, -0.80], [sx, 1.32, 0], 0.06);
        strut(B, 'metal', K.greenDk, [sx, 0, 0.80], [sx, 1.32, 0], 0.06);
        pcyl(B, NS('metal'), K.ironDk, 0.08, 0.04, sx, 1.32, 0, { rz: HP });
      }
      // Tilted pouring ladle body with slag crust
      pcyl(B, 'metal', K.ironRust, 0.48, 0.9, 0, 0.78, 0, { rx: HP + 0.25, seg: 14 });
      ptor(B, NS('metal'), K.ironDk, 0.50, 0.025, 0, 1.25, 0.1, { rx: HP + 0.25 });
      pbox(B, 'glow', K.lavaGlow, 0.35, 0.02, 0.40, 0, 1.23, 0.1, { rx: 0.25, glow: 1.8 });
      B.pop();

      // Gauge Machine House at [-10.5, 2.4, 4.6] (3.0 x 2.2 x 4.0, within 4 cm of face)
      B.push(-10.5, 2.4, 4.6);
      // Corrugated galvanized iron walls with dark green corner angles
      for (const sx of [-1.51, 1.51]) {
        pbox(B, 'metal', '#5c646b', 0.02, 2.15, 3.95, sx, 1.08, 0);
      }
      for (const sz of [-2.01, 2.01]) {
        pbox(B, 'metal', '#5c646b', 2.95, 2.15, 0.02, 0, 1.08, sz);
      }
      for (const sx of [-1.51, 1.51]) for (const sz of [-2.01, 2.01]) {
        pbox(B, NS('metal'), K.greenDk, 0.06, 2.2, 0.06, sx, 1.1, sz);
      }
      // Illuminated factory window on south face (facing mid / Pour Floor)
      pbox(B, 'glow', K.glassLit, 1.4, 1.0, 0.02, 0, 1.2, -2.01, { glow: 1.3 });
      pbox(B, NS('metal'), K.greenDk, 1.44, 0.04, 0.04, 0, 1.2, -2.01);
      pbox(B, NS('metal'), K.greenDk, 0.04, 1.04, 0.04, 0, 1.2, -2.01);
      // Copper float-well counterweight cable and dial
      pcyl(B, NS('metal'), K.copper, 0.02, 1.8, -1.1, 1.1, -2.02);
      pcyl(B, NS('metal'), K.brass, 0.2, 0.02, -1.1, 1.8, -2.03, { rx: HP });
      B.pop();

      // Valve Chest at [-6.15, 2.4, 0.0] (1.5 x 1.0 x 1.2, within 4 cm of face)
      B.push(-6.15, 2.4, 0.0);
      pbox(B, 'metal', K.ironDk, 1.52, 0.04, 1.22, 0, 0.02, 0);
      // Red handwheels on rising stems (stays within 7 cm of top)
      for (const sx of [-0.4, 0.4]) {
        pcyl(B, NS('metal'), K.ironLt, 0.02, 0.06, sx, 1.03, 0);
        ptor(B, 'metal', K.red, 0.12, 0.015, sx, 1.05, 0, { rx: HP });
        psph(B, NS('metal'), K.brass, 0.02, sx, 1.05, 0);
      }
      // Bolted bonnet flanges on side faces (flat against faces in XY plane)
      for (const sz of [-0.61, 0.61]) {
        ptor(B, NS('metal'), K.iron, 0.16, 0.02, 0, 0.55, sz);
      }
      B.pop();

      // Organ Stumps Columnar Dressing (basalt octagons [-6.4, -8.6], [-12.3, -2.7], [-7.0, -3.6])
      for (const [ox, oz, oy, orad] of [[-6.4, -8.6, 2.1, 0.9], [-12.3, -2.7, 2.4, 0.8], [-7.0, -3.6, 1.8, 0.8]]) {
        B.push(ox, 1.2, oz);
        // Riveted iron collar band around column (within 4 cm of face)
        ptor(B, NS('metal'), K.ironDk, orad * 0.93, 0.02, 0, (oy - 1.2) * 0.6, 0, { rx: HP });
        // Climbing rungs on face toward path
        for (let ry = 0.25; ry <= (oy - 1.2) * 0.85; ry += 0.3) {
          pbox(B, NS('paint'), K.gold, 0.25, 0.03, 0.03, 0, ry, orad * 0.92 + 0.01);
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
      // 1. Pattern Shop Details (on terrace at [-23.147, 2.4, -33.305], rotY: 126 deg)
      // Corner battens and windows proud of face, leaving main wall paintable for ink
      B.push(-23.147, 2.4, -33.305, 126 * D_);
      // Corner trim battens (proud of corners, 0 coplanar)
      for (const cx of [-1.97, 1.97]) for (const cz of [-0.87, 0.87]) {
        pbox(B, NS('paint'), K.white, 0.06, 2.9, 0.06, cx, 1.48, cz);
      }
      // Workshop Windows with glowing warm interior on front face
      for (const wx of [-1.0, 1.0]) {
        pbox(B, 'metal', K.greenDk, 1.1, 1.3, 0.04, wx, 1.6, 0.88);
        pbox(B, 'glow', K.glassLit, 0.95, 1.15, 0.02, wx, 1.6, 0.89, { glow: 1.4 });
        pbox(B, NS('paint'), K.white, 0.02, 1.15, 0.04, wx, 1.6, 0.89);
        pbox(B, NS('paint'), K.white, 0.95, 0.02, 0.04, wx, 1.6, 0.89);
      }
      // Corrugated Roof at y = 3.0 (stopping 4 cm below top, leaving coping open)
      pbox(B, 'paint', K.verdDk, 3.96, 0.04, 1.76, 0, 3.02, 0);
      pbox(B, NS('metal'), K.ironLt, 3.96, 0.03, 0.03, 0, 3.01, 0.88); // Front gutter
      pcyl(B, NS('metal'), K.iron, 0.02, 2.8, -1.97, 1.5, 0.88, { seg: 6 }); // Downpipe
      // Stove pipe chimney
      pcyl(B, 'metal', K.ironLt, 0.08, 1.4, 1.0, 3.7, -0.4, { seg: 8 });
      pcyl(B, NS('metal'), K.ironDk, 0.14, 0.08, 1.0, 4.3, -0.4, { seg: 8 });
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
      // 1. Ferry Castings Line East (x = -12.4, z = -55.5 to -46.75 and -43.25 to -40.85, y = 3.6 to 6.0)
      for (const [z0, z1] of [[-55.5, -46.75], [-43.25, -40.85]]) {
        const zc = (z0 + z1) / 2, zl = Math.abs(z1 - z0);
        B.push(-12.4, 3.6, zc);
        // Base timber dunnage runners
        pbox(B, 'wood', K.woodDk, 1.24, 0.12, zl + 0.02, 0, 0.06, 0);
        // Stacked locomotive wheel blanks and flywheel rings flush against wall faces (within 4 cm)
        for (let z = -zl / 2 + 1.2; z <= zl / 2 - 1.2; z += 2.4) {
          // East face (facing east lane, ry: HP puts ring in YZ plane parallel to wall)
          ptor(B, 'metal', K.iron, 0.55, 0.025, 0.61, 1.2, z, { ry: HP });
          pcyl(B, NS('metal'), K.ironLt, 0.16, 0.04, 0.61, 1.2, z, { rz: HP });
          // West face (facing center lane)
          ptor(B, 'metal', K.ironDk, 0.55, 0.025, -0.61, 1.2, z, { ry: HP });
          pcyl(B, NS('metal'), K.ironLt, 0.16, 0.04, -0.61, 1.2, z, { rz: HP });
        }
        // Heavy steel strapping bands every 2.0 m
        for (let z = -zl / 2 + 1.0; z <= zl / 2 - 1.0; z += 2.0) {
          pbox(B, NS('metal'), K.ironRust, 1.24, 0.06, 0.06, 0, 0.4, z);
          pbox(B, NS('metal'), K.ironRust, 1.24, 0.06, 0.06, 0, 1.8, z);
          pbox(B, NS('metal'), K.ironRust, 0.04, 2.35, 0.06, 0.61, 1.18, z);
          pbox(B, NS('metal'), K.ironRust, 0.04, 2.35, 0.06, -0.61, 1.18, z);
        }
        // Stencil plate: "HIGHMARK FOUNDRY - LOT 41"
        pbox(B, NS('paint'), K.white, 0.02, 0.45, 1.8, -0.61, 1.7, 0);
        pbox(B, NS('paint'), K.ironDk, 0.03, 0.1, 1.6, -0.615, 1.7, 0);
        B.pop();
      }

      // 2. Ferry Castings Line West (x = -27.7, z = -55.5 to -46.75, y = 3.6 to 6.0)
      {
        const z0 = -55.5, z1 = -46.75, zc = (z0 + z1) / 2, zl = Math.abs(z1 - z0);
        B.push(-27.7, 3.6, zc);
        pbox(B, 'wood', K.woodDk, 1.24, 0.12, zl + 0.02, 0, 0.06, 0);
        // Flanged steam manifold castings flush along faces (within 6 cm)
        for (let z = -zl / 2 + 1.5; z <= zl / 2 - 1.5; z += 3.0) {
          for (const sx of [-0.61, 0.61]) {
            pcyl(B, 'metal', K.iron, 0.035, 2.2, sx, 1.1, z, { rx: HP });
            ptor(B, NS('metal'), K.ironDk, 0.05, 0.012, sx, 1.1, z - 0.75, { rx: HP });
            ptor(B, NS('metal'), K.ironDk, 0.05, 0.012, sx, 1.1, z + 0.75, { rx: HP });
          }
        }
        for (let z = -zl / 2 + 1.0; z <= zl / 2 - 1.0; z += 2.0) {
          pbox(B, NS('metal'), K.ironRust, 1.24, 0.06, 0.06, 0, 0.4, z);
          pbox(B, NS('metal'), K.ironRust, 1.24, 0.06, 0.06, 0, 1.8, z);
        }
        B.pop();
      }

      // 3. Center Lane Gate Apron: Drain Grates (y = 3.6)
      // Corner angle brackets and top grate leaving wall faces open for ink
      B.push(-20.6, 3.6, -49.4);
      for (const sx of [-0.81, 0.81]) for (const sz of [-0.61, 0.61]) {
        pbox(B, 'metal', K.ironLt, 0.08, 1.24, 0.08, sx, 0.64, sz);
      }
      // Top iron drainage grates (stopping 4 cm below top)
      for (let x = -0.65; x <= 0.65; x += 0.22) {
        pbox(B, NS('metal'), K.iron, 0.06, 0.06, 1.16, x, 1.25, 0);
      }
      B.pop();

      // 4. Drum Stack at [-36.0, 3.6, -59.8] (r = 0.85, h = 1.3)
      // Steel retaining bands and brass bung, leaving drum walls open for ink
      B.push(-36.0, 3.6, -59.8);
      ptor(B, NS('metal'), K.ironDk, 0.80, 0.02, 0, 0.35, 0, { rx: HP });
      ptor(B, NS('metal'), K.ironDk, 0.80, 0.02, 0, 0.95, 0, { rx: HP });
      pcyl(B, NS('metal'), K.brass, 0.05, 0.03, 0.25, 1.26, 0);
      B.pop();

      // 5. Cable Drum at [-7.6, 3.6, -48.6] (r = 0.8, h = 1.3)
      // Top lifting shackle and plate, leaving drum wall 100% open for ink
      B.push(-7.6, 3.6, -48.6);
      pbox(B, 'metal', K.ironDk, 0.35, 0.04, 0.35, 0, 1.24, 0);
      ptor(B, NS('metal'), K.ironRust, 0.14, 0.03, 0, 1.26, 0, { rx: HP });
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
        ptor(B, NS('metal'), K.ironDk, 0.72, 0.08, 2.2, 9.4, 0, { rx: HP });
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
          ptor(B, NS('metal'), K.ironDk, 1.74, 0.04, 0, hy, 0, { rx: HP });
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

  // =========================================================================================================
  // 9. FOUNDRY PIECE SKINS & WALL-MOUNTED BULKHEAD LAMPS
  // Clads all eye-level pieces in authentic foundry skins within 2 cm, eliminating bare boxes.
  // =========================================================================================================
  D.caldera_piece_skins = {
    desc: 'Authentic foundry architectural piece skins and wall-mounted bulkhead lamps wrapping layout blocks within 2 cm',
    build(B) {
      // 1. Wall-mounted and pier-mounted foundry bulkhead lamps (softened glows to prevent blowout)
      // Pour Floor 4 piers (outer faces at y = 4.5)
      for (const [px, pz] of [[4.2, 1.75], [-4.2, 1.75], [-4.2, -1.75], [4.2, -1.75]]) {
        const nx = Math.sign(px);
        B.push(px + nx * 0.58, 4.5, pz);
        pbox(B, 'metal', K.ironDk, 0.12, 0.22, 0.12, 0, 0, 0);
        psph(B, 'glow', K.lampGlow, 0.05, 0, 0, 0, { glow: 0.85 });
        B.pop();
      }
      // Casting Hall pilaster wall lamps
      for (const z of [-48.0, -54.0]) {
        B.push(-12.4 + 0.51, 5.2, z);
        pbox(B, 'metal', K.ironDk, 0.08, 0.18, 0.08, 0, 0, 0);
        psph(B, 'glow', K.lampGlow, 0.045, 0, 0, 0, { glow: 0.85 });
        B.pop();
      }
      // Pattern shop & porch bulkhead lamps
      B.push(-14.5, 5.2, -37.0);
      pbox(B, 'metal', K.ironDk, 0.12, 0.2, 0.12, 0, 0, 0);
      psph(B, 'glow', K.lampGlow, 0.05, 0, 0, 0, { glow: 0.85 });
      B.pop();
      B.push(-21.0, 5.2, -35.0);
      pbox(B, 'metal', K.ironDk, 0.12, 0.2, 0.12, 0, 0, 0);
      psph(B, 'glow', K.lampGlow, 0.05, 0, 0, 0, { glow: 0.85 });
      B.pop();
      // Winch house bulkhead lantern
      B.push(-23.1, 2.5, -20.8);
      pbox(B, 'metal', K.ironDk, 0.12, 0.2, 0.12, 0, 0, 0);
      psph(B, 'glow', K.lampGlow, 0.05, 0, 0, 0, { glow: 0.85 });
      B.pop();
      // Spawn gallery bulkhead lamps
      for (const gx of [-12.4, -21.0]) {
        B.push(gx, 5.8, -67.5);
        pbox(B, 'metal', K.ironDk, 0.12, 0.22, 0.12, 0, 0, 0);
        psph(B, 'glow', K.lampGlow, 0.05, 0, 0, 0, { glow: 0.85 });
        B.pop();
      }

      // 2. Wrap ONLY dedicated foundry objects in Alpha's half (NO ground, floors, or full-wall casings!)
      const mirrorDef = (d) => {
        if (d.min && d.max) {
          return { ...d, min: [-d.max[0], d.min[1], -d.max[2]], max: [-d.min[0], d.max[1], -d.min[2]] };
        }
        if (d.center) {
          return { ...d, center: [-d.center[0], d.center[1], -d.center[2]], rotY: (d.rotY || 0) + 180 };
        }
        return d;
      };
      const allLayout = [
        ...(LAYOUT.single || []),
        ...(LAYOUT.half || []),
        ...(LAYOUT.half || []).map(mirrorDef),
      ];
      for (const b of allLayout) {
        let cx, cy, cz, w, h, d, ry = 0;
        if (b.center) {
          cx = b.center[0]; cy = b.center[1]; cz = b.center[2];
          w = b.size[0]; h = b.size[1]; d = b.size[2];
          ry = (b.rotY || 0) * D_;
        } else if (b.min) {
          cx = (b.min[0] + b.max[0]) / 2;
          cy = (b.min[1] + b.max[1]) / 2;
          cz = (b.min[2] + b.max[2]) / 2;
          w = b.max[0] - b.min[0];
          h = b.max[1] - b.min[1];
          d = b.max[2] - b.min[2];
          ry = 0;
        } else continue;

        if (cz > 0.3) continue; // Alpha half only
        if (Math.abs(cx) < 4.8 && Math.abs(cz) < 2.5) continue; // Pour Floor center clear below 7m

        const tag = b.tag || '';
        const y0 = cy - h / 2;

        // ONLY dress objects! Skip all ground, terrain, floors, ledges, and big walls!
        const isObject = [
          'parapet', 'valve-chest', 'vent-hood', 'weighbridge',
          'gauge-machine-house', 'lamp-plinth'
        ].some(t => tag.includes(t));

        if (!isObject) continue;

        B.push(cx, y0, cz, ry);

        if (tag.includes('parapet')) {
          // Architectural trims leaving >75% of face open for ink/climbing
          // 0 m² coplanar with floor or wall, 0 lids (y: 0.03 to h - 0.04)
          for (const sz of [-1, 1]) {
            const zc = sz * (d / 2 + 0.015);
            pbox(B, 'metal', K.ironDk, w + 0.04, 0.08, 0.03, 0, 0.07, zc);
            pbox(B, NS('metal'), K.ironLt, w + 0.04, 0.06, 0.03, 0, h - 0.07, zc);
            for (const sx of [-1, 1]) {
              const xc = sx * (w / 2 - 0.08);
              pbox(B, 'metal', K.ironRust, 0.10, h - 0.14, 0.035, xc, (h - 0.07) / 2 + 0.015, zc);
            }
          }
          for (const sx of [-1, 1]) {
            const xc = sx * (w / 2 + 0.015);
            pbox(B, 'metal', K.ironDk, 0.03, 0.08, d + 0.04, xc, 0.07, 0);
            pbox(B, NS('metal'), K.ironLt, 0.03, 0.06, d + 0.04, xc, h - 0.07, 0);
          }
        } else if (tag.includes('valve-chest')) {
          pbox(B, 'metal', K.ironDk, w + 0.04, 0.08, d + 0.04, 0, 0.07, 0);
          pbox(B, 'metal', K.ironDk, w + 0.04, 0.06, d + 0.04, 0, h - 0.06, 0);
          ptor(B, 'metal', K.red, 0.16, 0.02, w / 2 + 0.025, h * 0.6, 0, { ry: HP });
        } else if (tag.includes('vent-hood')) {
          pbox(B, 'metal', K.ironDk, w + 0.04, 0.08, d + 0.04, 0, 0.07, 0);
          pbox(B, 'metal', K.ironDk, w + 0.04, 0.06, d + 0.04, 0, h - 0.06, 0);
        } else if (tag.includes('gauge-machine-house')) {
          for (const sx of [-w / 2 + 0.1, w / 2 - 0.1]) {
            pbox(B, 'metal', K.greenDk, 0.18, h - 0.06, d + 0.03, sx, (h - 0.06) / 2, 0);
          }
          pbox(B, 'metal', K.ironDk, Math.min(w * 0.6, 1.2), Math.min(h * 0.6, 1.4), 0.05, 0, h * 0.5, d / 2 + 0.02);
        } else if (tag.includes('weighbridge')) {
          pbox(B, 'metal', K.ironDk, 1.2, 1.4, 0.06, 0, h * 0.5, -d / 2 + 0.04);
          pbox(B, 'metal', K.greenDk, 0.18, h - 0.06, 0.06, -w / 2 + 0.2, (h - 0.06) / 2, -d / 2 + 0.04);
          pbox(B, 'metal', K.greenDk, 0.18, h - 0.06, 0.06, w / 2 - 0.2, (h - 0.06) / 2, -d / 2 + 0.04);
          ptor(B, NS('metal'), K.brass, 0.35, 0.03, 0, h * 0.65, -d / 2 + 0.08, { rx: HP });
        } else if (tag === 'lamp-plinth') {
          // Skirting and top band on z faces, leaving +-x faces 100% open for Highmark decal
          for (const sz of [-1, 1]) {
            const zc = sz * (d / 2 + 0.015);
            pbox(B, 'paint', K.basaltDk, w + 0.04, 0.18, 0.03, 0, 0.11, zc);
            pbox(B, 'metal', K.ironDk, w + 0.04, 0.05, 0.03, 0, h - 0.05, zc);
          }
        }

        B.pop();
      }
    },
  };
}
