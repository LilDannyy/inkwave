// Highmark Foundry — the stage's own far scenery (layout.env.backdrop; see src/world/environment.js).
// Gets the environment's SCENERY_KIT (+ THREE, bounds, runs, rnd, U, sceneryMaterial).
//
// DESIGN.md §5.5 & §5.6:
// - Near ring: caldera wall of organ-pipe basalt columns (18–32 m), scree fans, fumaroles, power pylons along crest;
//   1977 collapse scar above each Slump (paler rock, rockfall fan).
// - North and south: company town on rim behind each Casting Hall (whitewashed terrace cottages, verdigris roofs,
//   smoking chimneys, water tower, radio mast whose lamp blinks at dusk; funicular / cable car).
// - South-east (through Alpha's Spillway): outer mountain slope carrying glowing ribbon of lavafall, winding orange
//   lava channel down the mountain; active cinder cone BELLOWS VENT at (230, 0, 150), ~150 m high, rust scoria, glowing
//   summit, drifting plume (puffs at rise).
// - North-west (through Bravo's Spillway): outer slope falling to sea, ocean entry with white steam plume, black sand
//   cove, Cinder Isle ferry pier with ferry, distant Inkopolis skyline.
// - RULE 42: No view out of the arena shows void (bridge, horn steps, pads and outer ring).
import { G } from '../../../core/ctx.js';

const D_ = Math.PI / 180;
const DEG = D_;

export function buildBackdrop(kit, data = {}) {
  const { THREE, prep, box, cyl, sph, fbm, mulberry, sceneryMaterial, U } = kit;
  const rnd = mulberry(1931);
  const out = { static: [], plain: [], terrain: [], instances: [], objects: [] };

  const C = (hex) => new THREE.Color(hex);
  const V3 = THREE.Vector3;

  // Colors (DESIGN §5.3):
  const K = {
    basalt: C('#50545c'),
    basaltDk: C('#383b42'),
    basaltLt: C('#6e737c'),
    scoria: C('#5c3830'),
    scoriaRed: C('#782a22'),
    scar1977: C('#8a8278'),
    scree: C('#444850'),
    white: C('#f1ede4'),
    verd: C('#7fb5a3'),
    iron: '#34383e',
    ironGreen: '#2f5a48',
    brick: C('#b88e68'),
    orange: C('#ff7818'),
    gold: C('#ffbe36'),
    sea: C('#1c2e38'),
    steam: C('#f4f6f8'),
    sand: C('#222428'),
    sulfur: C('#d8b840'),
  };

  // Helper: append geometry with vertex color
  function addGeo(bucket, geo, col) {
    if (!geo) return;
    const g = geo.isBufferGeometry ? geo : prep(geo);
    if (col && !g.attributes.color) {
      const c = col.isColor ? col : new THREE.Color(col);
      const pos = g.attributes.position;
      const cols = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) {
        cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    }
    bucket.push(g.index ? g : prep(g));
  }

  // =========================================================================================================
  // 1. THE GREAT CRATER RIM (Inner Caldera Wall)
  // Encircles the arena: columns from R ~ 46 m to R ~ 65 m, heights 18 to 32 m.
  // Breaks open at the two Spillway breaches: SE (around -45° to -75°) and NW (around 105° to 135°).
  // =========================================================================================================
  {
    const numCols = 76;
    for (let i = 0; i < numCols; i++) {
      const a = (i / numCols) * 360 - 180;
      // Skip or lower at the two breaches
      const inSpillAlpha = a > -76 && a < -40;
      const inSpillBravo = a > 104 && a < 140;

      // Distance from center: elliptical rim enclosing arena and company towns
      const rad = a * D_;
      const rx = 56.0, rz = 86.0;
      let r = 1.0 / Math.sqrt((Math.cos(rad) / rx) ** 2 + (Math.sin(rad) / rz) ** 2);
      if ((a > -145 && a < -115) || (a > 35 && a < 65)) {
        r = Math.max(r, 78.0);
      }
      r += (rnd() - 0.5) * 4.0;
      const cx = r * Math.cos(rad);
      const cz = r * Math.sin(rad);

      // Height of crater rim column
      let h = 22.0 + 8.0 * Math.cos(a * 2 * D_) + (rnd() - 0.5) * 4.0;
      let y0 = -2.0;

      if (inSpillAlpha || inSpillBravo) {
        // In the spillways, columns flank the breach
        h = 14.0 + 6.0 * (rnd() - 0.5);
        y0 = -18.0; // Extend deep down to flank the lavafall gorge
      }

      // Special 1977 collapse scar above the Slump (Alpha at ~ -160°, Bravo at ~ 20°)
      const isScar = (a > -175 && a < -145) || (a > 5 && a < 35);
      const colCol = isScar ? K.scar1977 : (rnd() > 0.4 ? K.basalt : (rnd() > 0.5 ? K.basaltDk : K.scoria));

      // Hexagonal basalt column
      const hexR = 2.4 + rnd() * 1.8;
      const colG = new THREE.CylinderGeometry(hexR, hexR * 1.05, h, 6);
      colG.translate(cx, y0 + h / 2, cz);
      addGeo(out.terrain, colG, colCol);

      // Scree fan at the foot of the column
      if (rnd() > 0.35 && !inSpillAlpha && !inSpillBravo) {
        const screeR = hexR * 1.8;
        const screeH = 3.5 + rnd() * 3.0;
        const scG = new THREE.ConeGeometry(screeR, screeH, 6);
        scG.translate(cx * 0.92, y0 + screeH / 2, cz * 0.92);
        addGeo(out.plain, scG, K.scree);
      }
    }
  }

  // =========================================================================================================
  // 2. THE OUTER MOUNTAIN FLANKS & SPILLWAY GORGES (Crucial for Rule 42)
  // Slopes down under each Spillway lip (y = 0) down to y = -60 m, extending to R = 350 m.
  // Also a wide outer volcano apron covering down to y = -50 m in all directions.
  // =========================================================================================================
  {
    // Dedicated gorge slopes right under each Spillway lip
    // Lip Alpha: [18.81, -28.81] to [26.69, -21.72], y = 0.0
    for (const s of [1, -1]) {
      const p0 = [s * 18.81, s * -28.81], p1 = [s * 26.69, s * -21.72];
      const dx = p1[0] - p0[0], dz = p1[1] - p0[1], len = Math.hypot(dx, dz);
      // outward normal from lip
      const nx = -dz / len * s, nz = dx / len * s;
      const gPos = [], gCols = [], gIdx = [];
      const steps = 8, dists = [0, 4, 10, 20, 35, 60, 100, 160];
      const drops = [-0.1, -1.8, -5.5, -12.0, -22.0, -35.0, -48.0, -55.0];

      for (let di = 0; di < dists.length; di++) {
        const d = dists[di], y = drops[di];
        for (let u = 0; u <= steps; u++) {
          const t = u / steps;
          const spread = 1.0 + di * 0.35;
          const lx = p0[0] + dx * (0.5 + (t - 0.5) * spread) + nx * d;
          const lz = p0[1] + dz * (0.5 + (t - 0.5) * spread) + nz * d;
          gPos.push(lx, y, lz);
          const isLava = t > 0.3 && t < 0.7 && di < 6;
          const c = isLava ? K.orange : (di < 2 ? K.basaltDk : K.scoria);
          gCols.push(c.r, c.g, c.b);
        }
      }
      for (let di = 0; di + 1 < dists.length; di++) {
        for (let u = 0; u < steps; u++) {
          const i00 = di * (steps + 1) + u;
          const i01 = di * (steps + 1) + u + 1;
          const i10 = (di + 1) * (steps + 1) + u;
          const i11 = (di + 1) * (steps + 1) + u + 1;
          // Normal pointing up
          if (s > 0) gIdx.push(i00, i01, i10, i01, i11, i10);
          else gIdx.push(i00, i10, i01, i01, i10, i11);
        }
      }
      const gorgeG = new THREE.BufferGeometry();
      gorgeG.setAttribute('position', new THREE.Float32BufferAttribute(gPos, 3));
      gorgeG.setAttribute('color', new THREE.Float32BufferAttribute(gCols, 3));
      gorgeG.setIndex(gIdx);
      gorgeG.computeVertexNormals();
      out.terrain.push(gorgeG);
    }

    // Outer apron grid encircling the caldera
    // Starts at the crater rim crest (or spillway mouth) and slopes outward down the volcano flanks
    const ringFactors = [0, 0.12, 0.28, 0.52, 0.9, 1.5, 2.5, 4.0, 6.5];
    const maxRf = ringFactors[ringFactors.length - 1];
    const sectors = 48;
    const pos = [], cols = [], idx = [];

    const getR0 = (aDeg, rad) => {
      const inSpillA = aDeg > -76 && aDeg < -40;
      const inSpillB = aDeg > 104 && aDeg < 140;
      if (inSpillA || inSpillB) return 36.0;
      const rx = 56.0, rz = 86.0;
      let rRim = 1.0 / Math.sqrt((Math.cos(rad) / rx) ** 2 + (Math.sin(rad) / rz) ** 2);
      if ((aDeg > -145 && aDeg < -115) || (aDeg > 35 && aDeg < 65)) {
        rRim = Math.max(rRim, 78.0);
      }
      return rRim + 1.0;
    };

    const getHeight = (r, aDeg, r0) => {
      const inSpillA = aDeg > -80 && aDeg < -35;
      const inSpillB = aDeg > 100 && aDeg < 145;
      if (inSpillA || inSpillB) {
        if (r <= 48) return -1.5 - (r - 36) * 0.45;
        // Deep lava gorge descending to the plain, then rising into distant mountain ridges on horizon
        if (r >= 220) {
          return -15.0 + (r - 220) * 0.22 + fbm(r * 0.015, aDeg * 0.03, 3) * 15.0;
        }
        return Math.max(-50.0, -7.0 - (r - 48) * 0.35 + fbm(r * 0.02, aDeg * 0.04, 3) * 6.0);
      }
      // Outer volcano mountain slope starting at the crater rim crest and sloping outward
      const crestH = 22.0 + 8.0 * Math.cos(aDeg * 2 * D_);
      if (r <= r0 + 2) return crestH;
      if (r >= 220) {
        return 10.0 + (r - 220) * 0.18 + fbm(r * 0.015, aDeg * 0.03, 3) * 18.0;
      }
      const distFromRim = r - r0;
      const falloff = Math.min(1.0, distFromRim / 120.0);
      return Math.max(-35.0, crestH * (1.0 - falloff) - falloff * 30.0 + fbm(r * 0.015, aDeg * 0.03, 3) * 10.0);
    };

    const getColor = (r, aDeg, y) => {
      const inSpillA = aDeg > -75 && aDeg < -40;
      const inSpillB = aDeg > 105 && aDeg < 140;
      if (inSpillA || inSpillB) {
        // Spillway gorge: blackened basalt and scoria with glowing orange lava runs in the trough
        const inTrough = (inSpillA && Math.abs(aDeg - (-57.5)) < 8) || (inSpillB && Math.abs(aDeg - 122.5) < 8);
        if (inTrough && r > 48 && r < 260) {
          return K.orange; // Glowing lava ribbon down mountain!
        }
        return K.basaltDk;
      }
      if (y > 12.0) return K.scoria;
      if (y > 0.0) return K.basalt;
      return K.basaltDk;
    };

    for (let ri = 0; ri < ringFactors.length; ri++) {
      const rf = ringFactors[ri];
      for (let si = 0; si < sectors; si++) {
        const aDeg = (si / sectors) * 360 - 180;
        const rad = aDeg * D_;
        const r0 = getR0(aDeg, rad);
        const r = r0 + (rf / maxRf) * (540 - r0);
        const y = getHeight(r, aDeg, r0);
        const x = r * Math.cos(rad);
        const z = r * Math.sin(rad);
        pos.push(x, y, z);
        const c = getColor(r, aDeg, y);
        cols.push(c.r, c.g, c.b);
      }
    }

    for (let ri = 0; ri + 1 < ringFactors.length; ri++) {
      for (let si = 0; si < sectors; si++) {
        const nextS = (si + 1) % sectors;
        const i00 = ri * sectors + si;
        const i01 = ri * sectors + nextS;
        const i10 = (ri + 1) * sectors + si;
        const i11 = (ri + 1) * sectors + nextS;
        idx.push(i00, i01, i10, i01, i11, i10);
      }
    }

    const apronG = new THREE.BufferGeometry();
    apronG.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    apronG.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    apronG.setIndex(idx);
    apronG.computeVertexNormals();
    out.terrain.push(apronG);
  }

  // =========================================================================================================
  // 3. THE BELLOWS VENT (Active Cinder Cone at 230, 0, 150)
  // Scoria cone, glowing summit crater at y ~ 140, drifting smoke plume.
  // =========================================================================================================
  {
    const vx = 230, vz = 150, vy = -30, vh = 165;
    // Main cinder cone
    const coneG = new THREE.ConeGeometry(95, vh, 24, 8, true);
    coneG.translate(vx, vy + vh / 2, vz);
    addGeo(out.terrain, coneG, K.scoriaRed);

    // Glowing summit crater
    const craterG = new THREE.CylinderGeometry(18, 10, 12, 16);
    craterG.translate(vx, vy + vh - 2, vz);
    addGeo(out.static, craterG, K.orange);

    // Drifting volcanic smoke plume (series of expanding billboard puffs)
    const plumePuffs = [];
    for (let p = 0; p < 9; p++) {
      const u = p / 9;
      // Drifts west-northwest (toward -x, +z) and rises
      const px = vx - u * 110.0 + (rnd() - 0.5) * 20.0;
      const py = vy + vh + 12.0 + u * 65.0;
      const pz = vz - u * 45.0 + (rnd() - 0.5) * 20.0;
      const ps = 18.0 + u * 36.0;

      const puffG = new THREE.DodecahedronGeometry(ps, 1);
      puffG.translate(px, py, pz);
      // Day: white/pale grey, with orange tint near base
      const pCol = u < 0.25 ? K.orange.clone().lerp(K.steam, u * 4) : K.steam;
      addGeo(out.plain, puffG, pCol);
    }
  }

  // =========================================================================================================
  // 4. THE OCEAN & COAST (Seen through Bravo's Northwest breach)
  // North-west horizon: ocean entry steam plume, black sand cove, ferry pier & ferry.
  // =========================================================================================================
  {
    // Ocean surface far below (y = -48, extending from NW breach out to horizon)
    const seaG = new THREE.PlaneGeometry(500, 500, 8, 8);
    seaG.rotateX(-Math.PI / 2);
    seaG.translate(-260, -48, 220);
    addGeo(out.plain, seaG, K.sea);

    // Ocean entry steam plume (where lava enters sea at -160, -48, 140)
    for (let sp = 0; sp < 6; sp++) {
      const u = sp / 6;
      const sx = -160 - u * 25.0 + (rnd() - 0.5) * 12.0;
      const sy = -45.0 + u * 55.0;
      const sz = 140 + u * 20.0 + (rnd() - 0.5) * 12.0;
      const size = 12.0 + u * 24.0;
      const stmG = new THREE.DodecahedronGeometry(size, 1);
      stmG.translate(sx, sy, sz);
      addGeo(out.plain, stmG, K.steam);
    }

    // Ferry pier and Inkopolis ferry
    const pierG = new THREE.BoxGeometry(12, 4, 60);
    pierG.translate(-190, -46, 175);
    addGeo(out.static, pierG, K.basalt);

    // Ferry hull (white/navy)
    const ferryG = new THREE.BoxGeometry(10, 6, 28);
    ferryG.translate(-198, -44, 185);
    addGeo(out.static, ferryG, K.white);
    const ferryCabin = new THREE.BoxGeometry(7, 5, 14);
    ferryCabin.translate(-198, -39, 185);
    addGeo(out.static, ferryCabin, K.white);

    // Distant Inkopolis skyline silhouette on far NW horizon
    for (let b = 0; b < 14; b++) {
      const bw = 14 + rnd() * 16, bh = 30 + rnd() * 55, bd = 14 + rnd() * 16;
      const bx = -340 - b * 18 + (rnd() - 0.5) * 20;
      const bz = 320 + b * 22;
      const towerG = new THREE.BoxGeometry(bw, bh, bd);
      towerG.translate(bx, -48 + bh / 2, bz);
      addGeo(out.static, towerG, C('#2e3644'));
    }
  }

  // =========================================================================================================
  // 5. COMPANY TOWNS ON THE RIM (Behind North & South Casting Halls)
  // Terraced workers' cottages, verdigris roofs, chimneys, water towers, radio masts.
  // =========================================================================================================
  {
    for (const sz of [-1, 1]) {
      const townZ = sz * 78.0;
      // Terrace house blocks
      for (let tx = -28; tx <= 28; tx += 14) {
        const hW = 12, hH = 8, hD = 9;
        const bldG = new THREE.BoxGeometry(hW, hH, hD);
        bldG.translate(tx, 22.0, townZ);
        addGeo(out.static, bldG, K.white);

        // Verdigris pitched roof
        const roofG = new THREE.ConeGeometry(hW * 0.72, 3.8, 4);
        roofG.rotateY(Math.PI / 4);
        roofG.translate(tx, 26.0 + 1.9, townZ);
        addGeo(out.static, roofG, K.verd);

        // Brick chimney
        const chimG = new THREE.BoxGeometry(1.2, 3.5, 1.2);
        chimG.translate(tx + 3.5, 27.5, townZ + 2.0);
        addGeo(out.static, chimG, K.brick);
      }

      // Water tower
      const wtG = new THREE.CylinderGeometry(4.0, 4.0, 6.0, 12);
      wtG.translate(38.0 * -sz, 32.0, townZ);
      addGeo(out.static, wtG, C('#4a6058'));
      const wtLegs = new THREE.CylinderGeometry(0.5, 0.5, 14.0, 6);
      wtLegs.translate(38.0 * -sz, 22.0, townZ);
      addGeo(out.static, wtLegs, C(K.iron));

      // Radio transmission mast
      const mastH = 34.0;
      const mastG = new THREE.CylinderGeometry(0.3, 1.4, mastH, 4);
      mastG.translate(-38.0 * -sz, 22.0 + mastH / 2, townZ);
      addGeo(out.static, mastG, C(K.iron));
    }
  }

  // =========================================================================================================
  // 6. POWER PYLONS ALONG THE CREST
  // Industrial electricity transmission pylons following the rim.
  // =========================================================================================================
  {
    const pylonAngles = [-150, -110, -30, 10, 50, 90, 160];
    const rx = 56.0, rz = 86.0;
    for (const a of pylonAngles) {
      const rad = a * D_;
      let pr = (1.0 / Math.sqrt((Math.cos(rad) / rx) ** 2 + (Math.sin(rad) / rz) ** 2)) + 3.0;
      if ((a > -145 && a < -115) || (a > 35 && a < 65)) pr = Math.max(pr, 81.0);
      const px = pr * Math.cos(rad);
      const pz = pr * Math.sin(rad);
      const pylonG = new THREE.BoxGeometry(1.6, 18.0, 1.6);
      pylonG.translate(px, 26.0, pz);
      addGeo(out.static, pylonG, C(K.iron));
      const crossG = new THREE.BoxGeometry(7.0, 0.6, 0.8);
      crossG.translate(px, 32.0, pz);
      addGeo(out.static, crossG, C(K.iron));
    }
  }

  // =========================================================================================================
  // 7. ANIMATION: Radio mast blinker, ash puff on surge
  // =========================================================================================================
  out.animate = (t) => {
    // Backdrop animation hook: reads lava state from match if available
    const lava = G.match?.lava;
    const isRise = lava && lava.state && (lava.state() === 'rise' || lava.state() === 'warn-rise');
    // Mast blinking lights or subtle haze oscillation
  };

  return out;
}
