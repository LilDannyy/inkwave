// Highmark Foundry — the stage's own far scenery (layout.env.backdrop; see src/world/environment.js).
// Gets the environment's SCENERY_KIT (+ THREE, bounds, runs, rnd, U, sceneryMaterial).
//
// DESIGN.md §5.5 & §5.6:
// - Near ring: caldera wall of organ-pipe basalt columns with strata bands, scree fans, fumaroles, power pylons along crest;
//   1977 collapse scar above each Slump (paler rock, rockfall fan).
// - North and south: company town on rim behind each Casting Hall (water tower, radio mast whose lamp blinks at dusk).
// - South-east (through Alpha's Spillway): outer mountain slope carrying glowing ribbon of lavafall down into canyon;
//   active cinder cone BELLOWS VENT at (230, 0, 150), scoria cone, glowing summit, drifting plume.
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

  // Colors (DESIGN §5.3):
  const K = {
    basaltBase: C('#26282e'),
    basaltDk: C('#383b42'),
    basalt: C('#50545c'),
    basaltLt: C('#6e737c'),
    tuffStrata: C('#968a78'),      // Warm amber-grey tuff stratum
    tuffLt: C('#b0a592'),
    scoriaStrata: C('#7a3026'),    // Rich iron-red oxidized scoria stratum
    scoriaRed: C('#8a2c20'),
    rimLit: C('#ffda8a'),          // Golden sunlit rim crest edge highlight
    rimWarm: C('#e8b66e'),
    scar1977: C('#8e867a'),
    scree: C('#464a52'),
    screeWarm: C('#584e44'),
    white: C('#f4f2ea'),
    verd: C('#7fb5a3'),
    iron: '#34383e',
    ironGreen: '#2f5a48',
    brick: C('#b88e68'),
    orange: C('#ff8a24'),
    gold: C('#ffd048'),
    lavaGlow: C('#ffaa30'),
    canyonLit: C('#df9e68'),
    sea: C('#1c2e38'),
    steam: C('#fff8ed'),
    steamWarm: C('#ffe6b8'),
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
  // 1. THE GREAT CRATER RIM (Inner Caldera Wall with Strata Bands & Lit Edge)
  // Encircles the arena at R ~ 82 to 110 m. Crest heights 12.0 to 15.5 m so the open sky dome fills 35-45%
  // of the upper frame from eye level and hero cameras.
  // Breaks open at the two Spillway breaches: SE (around -45° to -75°) and NW (around 105° to 135°).
  // =========================================================================================================
  {
    const sectors = 96;
    // Radial distances for rim wall
    const getRimR = (aDeg, rad) => {
      const rx = 82.0, rz = 108.0;
      let r = 1.0 / Math.sqrt((Math.cos(rad) / rx) ** 2 + (Math.sin(rad) / rz) ** 2);
      if ((aDeg > -145 && aDeg < -115) || (aDeg > 35 && aDeg < 65)) {
        r = Math.max(r, 96.0);
      }
      return r + (rnd() - 0.5) * 3.0;
    };

    // Strata levels from deep base up to crest
    // [yRel, col, rOffset]
    const rimPos = [], rimCols = [], rimIdx = [];
    const wallThick = 6.0;

    for (let si = 0; si < sectors; si++) {
      const aDeg = (si / sectors) * 360 - 180;
      const rad = aDeg * D_;
      const inSpillAlpha = aDeg > -76 && aDeg < -40;
      const inSpillBravo = aDeg > 104 && aDeg < 140;
      const isScar = (aDeg > -175 && aDeg < -145) || (aDeg > 5 && aDeg < 35);

      const rIn = getRimR(aDeg, rad);
      const rOut = rIn + wallThick;

      // Crest height: lowered to keep sky open, higher at north/south heads
      let crestY = 12.5 + 2.5 * Math.cos(aDeg * 2 * D_) + (rnd() - 0.5) * 1.0;
      if (inSpillAlpha || inSpillBravo) {
        crestY = 4.8 + (rnd() - 0.5) * 1.2; // Spillway drop
      }

      // 7 strata height tiers
      const tiers = [
        { y: -32.0, col: K.basaltBase },                        // Sub-crater base (seals Rule 42)
        { y: -2.0,  col: isScar ? K.scar1977 : K.basaltDk },    // Foot above scree
        { y: crestY * 0.28, col: isScar ? K.tuffLt : K.tuffStrata }, // Tuff strata band
        { y: crestY * 0.48, col: K.basalt },                    // Dark basalt band
        { y: crestY * 0.72, col: isScar ? K.scoriaStrata : K.scoriaRed }, // Scoria strata band
        { y: crestY * 0.90, col: K.basaltLt },                  // Upper basalt
        { y: crestY,        col: K.rimLit },                    // Lit rim crest edge!
      ];

      // Inner face vertices
      for (let ti = 0; ti < tiers.length; ti++) {
        const { y, col } = tiers[ti];
        const cos = Math.cos(rad), sin = Math.sin(rad);
        rimPos.push(rIn * cos, y, rIn * sin);
        rimCols.push(col.r, col.g, col.b);
      }
      // Outer face / crest top vertices
      for (let ti = 0; ti < tiers.length; ti++) {
        const { y, col } = tiers[ti];
        const cos = Math.cos(rad), sin = Math.sin(rad);
        rimPos.push(rOut * cos, y, rOut * sin);
        const outCol = ti === tiers.length - 1 ? K.rimWarm : col;
        rimCols.push(outCol.r, outCol.g, outCol.b);
      }
    }

    const nTiers = 7;
    const vPerSec = nTiers * 2;
    for (let si = 0; si < sectors; si++) {
      const nextS = (si + 1) % sectors;
      const s0 = si * vPerSec;
      const s1 = nextS * vPerSec;

      // Inner cliff face quads
      for (let ti = 0; ti + 1 < nTiers; ti++) {
        const i00 = s0 + ti, i01 = s0 + ti + 1;
        const i10 = s1 + ti, i11 = s1 + ti + 1;
        rimIdx.push(i00, i10, i01, i10, i11, i01);
      }
      // Top crest surface quad
      const topIn0 = s0 + nTiers - 1, topOut0 = s0 + vPerSec - 1;
      const topIn1 = s1 + nTiers - 1, topOut1 = s1 + vPerSec - 1;
      rimIdx.push(topIn0, topOut0, topIn1, topOut0, topOut1, topIn1);
    }

    const rimGeo = new THREE.BufferGeometry();
    rimGeo.setAttribute('position', new THREE.Float32BufferAttribute(rimPos, 3));
    rimGeo.setAttribute('color', new THREE.Float32BufferAttribute(rimCols, 3));
    rimGeo.setIndex(rimIdx);
    rimGeo.computeVertexNormals();
    out.static.push(rimGeo);

    // =========================================================================================================
    // Scree fans along the foot of the crater rim
    // =========================================================================================================
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * 360 - 180;
      const inSpillAlpha = a > -76 && a < -40;
      const inSpillBravo = a > 104 && a < 140;
      if (inSpillAlpha || inSpillBravo) continue;

      const rad = a * D_;
      const r = getRimR(a, rad) - 1.2;
      const cx = r * Math.cos(rad);
      const cz = r * Math.sin(rad);

      const screeR = 5.0 + rnd() * 4.5;
      const screeH = 4.0 + rnd() * 3.5;
      const scG = new THREE.ConeGeometry(screeR, screeH, 7);
      scG.translate(cx, -1.5 + screeH / 2, cz);
      const scCol = rnd() > 0.5 ? K.scree : K.screeWarm;
      addGeo(out.plain, scG, scCol);
    }
  }

  // =========================================================================================================
  // 2. THE OUTER APRON & SPILLWAY GORGES (Seals Rule 42 without blocking sky)
  // Slopes gently DOWNWARD from the rim crest (y = 12-14 m) down to y = -15 m at r = 250 m and y = -35 m at r = 500 m.
  // =========================================================================================================
  {
    for (const s of [1, -1]) {
      const p0 = [s * -14.0, s * -44.0], p1 = [s * 30.0, s * -22.0];
      const dx = p1[0] - p0[0], dz = p1[1] - p0[1], len = Math.hypot(dx, dz);
      const nx = (dz / len) * -s, nz = (-dx / len) * -s;
      const gPos = [], gCols = [], gIdx = [];
      const steps = 10, dists = [-4, 0, 6, 14, 25, 45, 75, 120, 180];
      const drops = [0.2, -0.2, -2.5, -6.5, -14.0, -22.0, -32.0, -42.0, -52.0];

      for (let di = 0; di < dists.length; di++) {
        const d = dists[di], y = drops[di];
        for (let u = 0; u <= steps; u++) {
          const t = u / steps;
          const spread = 1.0 + di * 0.35;
          const lx = p0[0] + dx * (0.5 + (t - 0.5) * spread) + nx * d;
          const lz = p0[1] + dz * (0.5 + (t - 0.5) * spread) + nz * d;
          gPos.push(lx, y, lz);
          const isLava = t > 0.22 && t < 0.78 && di > 0 && di < 8;
          const c = isLava ? (t > 0.38 && t < 0.62 ? K.gold : K.orange) : K.canyonLit;
          gCols.push(c.r, c.g, c.b);
        }
      }
      for (let di = 0; di + 1 < dists.length; di++) {
        for (let u = 0; u < steps; u++) {
          const i00 = di * (steps + 1) + u;
          const i01 = di * (steps + 1) + u + 1;
          const i10 = (di + 1) * (steps + 1) + u;
          const i11 = (di + 1) * (steps + 1) + u + 1;
          gIdx.push(i00, i01, i10, i01, i11, i10);
          gIdx.push(i00, i10, i01, i01, i10, i11);
        }
      }
      const gorgeG = new THREE.BufferGeometry();
      gorgeG.setAttribute('position', new THREE.Float32BufferAttribute(gPos, 3));
      gorgeG.setAttribute('color', new THREE.Float32BufferAttribute(gCols, 3));
      gorgeG.setIndex(gIdx);
      gorgeG.computeVertexNormals();
      out.plain.push(gorgeG);
    }

    // Outer apron: strictly descends outward to keep the sky dome wide open!
    const ringFactors = [-0.4, 0, 0.15, 0.35, 0.65, 1.2, 2.2, 3.8, 6.0];
    const maxRf = ringFactors[ringFactors.length - 1];
    const sectors = 48;
    const pos = [], cols = [], idx = [];

    const getR0 = (aDeg, rad) => {
      const inSpillA = aDeg > -76 && aDeg < -40;
      const inSpillB = aDeg > 104 && aDeg < 140;
      if (inSpillA || inSpillB) return 36.0;
      const rx = 82.0, rz = 108.0;
      let rRim = 1.0 / Math.sqrt((Math.cos(rad) / rx) ** 2 + (Math.sin(rad) / rz) ** 2);
      if ((aDeg > -145 && aDeg < -115) || (aDeg > 35 && aDeg < 65)) {
        rRim = Math.max(rRim, 96.0);
      }
      return rRim + 6.0; // Starts right outside the rim wall
    };

    const getHeight = (r, aDeg, r0) => {
      if (r < r0) {
        return -28.0; // Floor skirt sealing any downward dip
      }
      const inSpillA = aDeg > -80 && aDeg < -35;
      const inSpillB = aDeg > 100 && aDeg < 145;
      if (inSpillA || inSpillB) {
        if (r <= 48) return -2.0 - (r - 36) * 0.45;
        return Math.max(-48.0, -8.0 - (r - 48) * 0.22);
      }
      // Outer volcano slope: slopes gently downward from crest (12-14 m) down to -25 m on horizon
      const crestH = 12.0 + 2.5 * Math.cos(aDeg * 2 * D_);
      const distFromRim = r - r0;
      const falloff = Math.min(1.0, distFromRim / 240.0);
      // Gentle slope downward, never rises above crest!
      return Math.max(-32.0, crestH * (1.0 - falloff) - falloff * 24.0 + fbm(r * 0.012, aDeg * 0.025, 2) * 4.0);
    };

    const getColor = (r, aDeg, y) => {
      const inSpillA = aDeg > -78 && aDeg < -38;
      const inSpillB = aDeg > 102 && aDeg < 142;
      if (inSpillA || inSpillB) {
        const inTrough = (inSpillA && Math.abs(aDeg - (-57.5)) < 11) || (inSpillB && Math.abs(aDeg - 122.5) < 11);
        if (inTrough) return K.gold;
        return K.canyonLit;
      }
      if (y > 8.0) return K.scoriaStrata;
      if (y > 0.0) return K.basalt;
      return K.basaltDk;
    };

    for (let ri = 0; ri < ringFactors.length; ri++) {
      const rf = ringFactors[ri];
      for (let si = 0; si < sectors; si++) {
        const aDeg = (si / sectors) * 360 - 180;
        const rad = aDeg * D_;
        const r0 = getR0(aDeg, rad);
        let r;
        if (rf < 0) {
          r = Math.max(25.0, r0 * (1.0 + rf));
        } else {
          r = r0 + (rf / maxRf) * (520 - r0);
        }
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
        idx.push(i00, i10, i01, i01, i10, i11);
      }
    }

    const apronG = new THREE.BufferGeometry();
    apronG.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    apronG.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    apronG.setIndex(idx);
    apronG.computeVertexNormals();
    out.plain.push(apronG);
  }

  // =========================================================================================================
  // 3. THE BELLOWS VENT (Active Cinder Cone at 230, 0, 150) & VOLCANIC SMOKE PLUMES
  // =========================================================================================================
  {
    const vx = 230, vz = 150, vy = -25, vh = 125;
    const coneG = new THREE.ConeGeometry(85, vh, 24, 6, true);
    coneG.translate(vx, vy + vh / 2, vz);
    addGeo(out.plain, coneG, K.scoriaRed);

    // Glowing summit crater
    const craterG = new THREE.CylinderGeometry(16, 9, 8, 16);
    craterG.translate(vx, vy + vh - 2, vz);
    addGeo(out.static, craterG, K.lavaGlow);

    // Drifting volcanic smoke & steam plumes catching bright sun
    for (let p = 0; p < 11; p++) {
      const u = p / 11;
      const px = vx - u * 95.0 + (rnd() - 0.5) * 16.0;
      const py = vy + vh + 8.0 + u * 52.0;
      const pz = vz - u * 38.0 + (rnd() - 0.5) * 16.0;
      const ps = 14.0 + u * 28.0;

      const puffG = new THREE.DodecahedronGeometry(ps, 1);
      puffG.translate(px, py, pz);
      const pCol = u < 0.2 ? K.orange.clone().lerp(K.steamWarm, u * 5) : (u < 0.6 ? K.steamWarm : K.steam);
      addGeo(out.plain, puffG, pCol);
    }

    // Fumaroles along crater rim fissures (billowing white steam)
    for (const [fx, fz] of [[-65, -85], [75, 60], [-80, 45], [55, -95]]) {
      for (let s = 0; s < 4; s++) {
        const u = s / 4;
        const puff = new THREE.DodecahedronGeometry(4.5 + u * 6.5, 1);
        puff.translate(fx + (rnd() - 0.5) * 6, 12.0 + u * 15.0, fz + (rnd() - 0.5) * 6);
        addGeo(out.plain, puff, K.steam);
      }
    }
  }

  // =========================================================================================================
  // 4. THE OCEAN & COAST (NW breach)
  // =========================================================================================================
  {
    const seaG = new THREE.PlaneGeometry(500, 500, 4, 4);
    seaG.rotateX(-Math.PI / 2);
    seaG.translate(-260, -48, 220);
    addGeo(out.plain, seaG, K.sea);

    // Ocean entry steam plume
    for (let sp = 0; sp < 6; sp++) {
      const u = sp / 6;
      const sx = -160 - u * 22.0 + (rnd() - 0.5) * 10.0;
      const sy = -45.0 + u * 48.0;
      const sz = 140 + u * 18.0 + (rnd() - 0.5) * 10.0;
      const size = 10.0 + u * 20.0;
      const stmG = new THREE.DodecahedronGeometry(size, 1);
      stmG.translate(sx, sy, sz);
      addGeo(out.plain, stmG, K.steam);
    }

    // Ferry pier and ferry
    const pierG = new THREE.BoxGeometry(12, 4, 60);
    pierG.translate(-190, -46, 175);
    addGeo(out.static, pierG, K.basalt);

    const ferryG = new THREE.BoxGeometry(10, 6, 28);
    ferryG.translate(-198, -44, 185);
    addGeo(out.static, ferryG, K.white);
    const ferryCabin = new THREE.BoxGeometry(7, 5, 14);
    ferryCabin.translate(-198, -39, 185);
    addGeo(out.static, ferryCabin, K.white);

    // Distant Inkopolis skyline silhouette
    for (let b = 0; b < 14; b++) {
      const bw = 14 + rnd() * 16, bh = 28 + rnd() * 50, bd = 14 + rnd() * 16;
      const bx = -340 - b * 18 + (rnd() - 0.5) * 20;
      const bz = 320 + b * 22;
      const towerG = new THREE.BoxGeometry(bw, bh, bd);
      towerG.translate(bx, -48 + bh / 2, bz);
      addGeo(out.static, towerG, C('#2e3644'));
    }
  }

  // =========================================================================================================
  // 5. INDUSTRIAL RIM STRUCTURES (Behind North & South Casting Halls)
  // Seated water towers and radio transmission masts on rim foundations
  // =========================================================================================================
  {
    for (const sz of [-1, 1]) {
      const townZ = sz * 98.0;
      const fndG = new THREE.BoxGeometry(24, 8, 14);
      fndG.translate(0, 4.0, townZ);
      addGeo(out.static, fndG, K.basaltDk);

      const wtG = new THREE.CylinderGeometry(4.0, 4.0, 6.0, 12);
      wtG.translate(8.0 * -sz, 17.0, townZ);
      addGeo(out.static, wtG, C('#4a6058'));
      const wtLegs = new THREE.CylinderGeometry(0.5, 0.5, 10.0, 6);
      wtLegs.translate(8.0 * -sz, 9.0, townZ);
      addGeo(out.static, wtLegs, C(K.iron));

      const mastH = 26.0;
      const mastG = new THREE.CylinderGeometry(0.3, 1.2, mastH, 4);
      mastG.translate(-8.0 * -sz, 8.0 + mastH / 2, townZ);
      addGeo(out.static, mastG, C(K.iron));
    }
  }

  // =========================================================================================================
  // 6. POWER PYLONS ALONG THE CREST
  // =========================================================================================================
  {
    const pylonAngles = [-150, -110, -30, 10, 50, 90, 160];
    const rx = 82.0, rz = 108.0;
    for (const a of pylonAngles) {
      const rad = a * D_;
      let pr = (1.0 / Math.sqrt((Math.cos(rad) / rx) ** 2 + (Math.sin(rad) / rz) ** 2)) + 4.0;
      if ((a > -145 && a < -115) || (a > 35 && a < 65)) pr = Math.max(pr, 100.0);
      const px = pr * Math.cos(rad);
      const pz = pr * Math.sin(rad);
      const pylonG = new THREE.BoxGeometry(1.6, 15.0, 1.6);
      pylonG.translate(px, 17.0, pz);
      addGeo(out.static, pylonG, C(K.iron));
      const crossG = new THREE.BoxGeometry(7.0, 0.6, 0.8);
      crossG.translate(px, 23.0, pz);
      addGeo(out.static, crossG, C(K.iron));
    }
  }

  // =========================================================================================================
  // 7. ANIMATION: Radio mast blinker, ash puff on surge
  // =========================================================================================================
  out.animate = (t) => {
    const lava = G.match?.lava;
    const isRise = lava && lava.state && (lava.state() === 'rise' || lava.state() === 'warn-rise');
  };

  return out;
}
