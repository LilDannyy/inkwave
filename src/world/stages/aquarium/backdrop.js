// Gulper Aquarium — the stage's own looks outside the level geometry (layout.env.backdrop; see the top of
// src/world/environment.js). Gets the environment's SCENERY_KIT (+ THREE, bounds, runs, rnd, U, sceneryMaterial) — it
// imports nothing that imports three, so layout.js stays importable in Node.
//
// What this draws (the level blocks for every glass and water volume are hidden colliders: layout.js `glass`, and the
// stand-ins it makes `hidden`): the glass panels, the water of the Great Tank, the kelp drums, the Arch Tanks, the Reef
// Windows, the bubble columns, the touch pools and the penguins' pools (one shared water material: looks.js), the kelp and
// its tide (here), the fish, the moon jellies, the penguins, Bathysphere No. 1 and Feeding Time (looks.js), the four Tide
// Gauges (here), and the islet's sea wall, the Deep Dome and the breakwater light (far.js). The Inkopolis-bay scenery
// stays on (env.bay). The Tubeway itself (tubes, mouths, fans, flaps, signs, chevrons, floor arrows) is the pipe engine's
// (src/game/pipes.js + src/fx/pipesFx.js). The Tide Gauges are the stage's own world cue for the tide (two per gatehouse
// on its crest at x ±4.5, centre 10.8 m, Ø 2.4 brass, double-faced): a needle between ▲ UP and ▼ DOWN and a red 10 s
// countdown, driven by the pipe engine's tide (G.match.pipes.flow(), a pure function of the stage clock).
import { G } from '../../../core/ctx.js';
import { waterMaterial, glassMaterial, buildFish, buildPenguins, buildSwimmers, buildJellies, buildBubbleCols, buildBathysphere, feedingTime, buildKrill, buildExhibits, bubbleQuads, BUBBLE_VS_PARS, BUBBLE_VS_PROJECT, BUBBLE_FS } from './looks.js';
import { TOUCH } from './geo.js';   // (the touch pools' panels: their acrylic is the traced plane's own sheen, looks.js — the house
                                     // glass reflected the sky at child height and washed the water out)
import { buildFar } from './far.js';

const C30 = Math.cos(Math.PI / 6);
const W = (s, w) => [0.5 * s + C30 * w, -32.5 - C30 * s + 0.5 * w];
// the tube runs inside water volumes (the water clears round them along the eye ray): the Gulper Run across the Great
// Tank, the Kelp Lines' risers and top runs in the drums, the Arch Lines' overhead runs in the Arch Tanks
const TUBE_RUNS = [
  [-7.6, 0.5, 0, 7.6, 0.5, 0],
  [27.4, 0.8, -1.2, 27.4, 9.0, -1.2], [27.4, 9.0, -1.2, 26.05, 9.0, 4.28],
  [-27.4, 0.8, 1.2, -27.4, 9.0, 1.2], [-27.4, 9.0, 1.2, -26.05, 9.0, -4.28],
  [7.32, 7.5, -27.13, -7.32, 7.5, -27.13], [7.32, 7.5, 27.13, -7.32, 7.5, 27.13],
];
// the stand-ins drawn here in their own way (not as plain glass boxes)
const OWN = new Set(['drum-glass', 'bathysphere', 'jelly', 'bubble-column', 'reef-window']);

export function buildBackdrop(kit, data = {}) {
  const T = kit.THREE, DEG = Math.PI / 180;
  const U = { uFT: { value: 0 }, uFT2: { value: 0 }, uKrill: { value: 0 }, uNight: kit.U ? kit.U.uNight : { value: 0 } };
  const buckets = { glass: [], water: [], clear: [] };
  const put = (k, g) => buckets[k].push(g.index ? g.toNonIndexed() : g);
  // ---- glass panels and water volumes (from the layout's hidden glass pieces, both halves)
  // (every pane is drawn GI = 1.5 cm in from its collider on all sides: the panes' faces lay exactly on the walls, lids and
  // kerbs they meet — the Arch Tank's sides on the hall's pylon walls at x ±6, its top on the gatehouse lid's underside at
  // 9.0, the Great Tank's panes on their granite kerbs — and a transparent face coplanar with an opaque one z-fights:
  // the hatched staircase overhead in the shark tunnel and the streaks down its walls, LEAD-REVIEW art round 2)
  const GI = 0.015, inset = (v) => (v > 0.2 ? v - 2 * GI : v);
  for (const d of data.glass || []) {
    if (OWN.has(d.tag)) continue;
    let g;
    if (d.kind === 'box') { g = new T.BoxGeometry(inset(d.max[0] - d.min[0]), inset(d.max[1] - d.min[1]), inset(d.max[2] - d.min[2])); g.translate((d.min[0] + d.max[0]) / 2, (d.min[1] + d.max[1]) / 2, (d.min[2] + d.max[2]) / 2); }
    else if (d.kind === 'obox') { g = new T.BoxGeometry(inset(d.size[0]), inset(d.size[1]), inset(d.size[2])); g.rotateY(d.rotY * DEG); g.translate(d.center[0], d.center[1], d.center[2]); }
    else continue;
    // (the water inside its glass, a few cm in from every face — scaled about the box's own centre: scaled about the
    // origin it stood 13 cm out through the gatehouse fascias and 24 cm down into the hall, a dark pane over the letters)
    if (d.tag === 'arch-tank') { const w = g.clone(), c = new T.Vector3((d.min[0] + d.max[0]) / 2, (d.min[1] + d.max[1]) / 2, (d.min[2] + d.max[2]) / 2); w.translate(-c.x, -c.y, -c.z); w.scale(0.98, 0.96, 0.98); w.translate(c.x, c.y, c.z); put('water', w); }
    put('glass', g);
  }
  // the Great Tank's water (a 16-gon prism inside its glass, down to the sunk sand bed)
  const tank = data.tank || { a: 7.5 };
  { const g = new T.CylinderGeometry((tank.a - 0.3) / Math.cos(Math.PI / 16), (tank.a - 0.3) / Math.cos(Math.PI / 16), 2.7, 16, 1, false, 78.75 * DEG); g.translate(0, 0.75, 0); put('water', g); }
  // the Reef Windows (r 30.5 → 32.5, glass 0.6 … 3.4; Alpha's α −70 … −67 and −58 … −2.6, and the twins): the glass on
  // the court face, the water behind it
  const arcGeo = (r, a0, a1, y0, y1, n, cap = false) => { const g = new T.CylinderGeometry(r, r, y1 - y0, n, 1, !cap, Math.PI / 2 - a1 * DEG, (a1 - a0) * DEG); g.translate(0, (y0 + y1) / 2, 0); return g; };
  for (const [a0, a1] of [[-70, -67], [-58, -2.6], [110, 113], [122, 177.4]]) {
    const n = Math.max(2, Math.round((a1 - a0) / 2));
    put('glass', arcGeo(30.47, a0, a1, 0.64, 3.36, n));
    put('clear', arcGeo(30.56, a0, a1, 0.64, 3.36, n));
  }
  // the bubble columns (the Shark Arch's court mouths) and the touch pools: water, glass
  for (const s of [1, -1]) {
    const gl = new T.CylinderGeometry(1.29, 1.29, 5.28, 28, 1, true); gl.translate(0, 0.37 + 2.64, s * -21.5); put('glass', gl);
    const wa = new T.CylinderGeometry(1.22, 1.22, 5.2, 24, 1, false); wa.translate(0, 0.4 + 2.6, s * -21.5); put('clear', wa);
    const tp = new T.BoxGeometry(4.9, 0.05, 2.5); tp.translate(s * -9.0, 2.04, s * -14.3); put('clear', tp);
  }
  // the penguins' pool in each cove (blade frame s 6.4, w −20.0: Ø 2.4, its water at 0.52)
  const POOL = [6.4, -20.0, 1.15, 0.52];
  for (const s of [1, -1]) { const [x, z] = W(POOL[0], POOL[1]); const pw = new T.CylinderGeometry(POOL[2], POOL[2], 0.04, 24); pw.translate(s * x, POOL[3], s * z); put('clear', pw); }
  // the kelp drums: glass cylinders, water, kelp fronds (thinned to clear water round the Kelp Line's run through the drum)
  const segD = (x, z, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - ax - dx * t, z - az - dz * t); };
  const kelpRun = (x, z) => segD(x, z, 27.4, -4.6, 27.4, -1.2), kelpTop = (x, z) => segD(x, z, 27.4, -1.2, 26.05, 4.28);   // (the E drum's; the W drum's turned)
  const kelp = [], bubbles = [];
  for (const [cx, cz, sg] of [[25, 0, 1], [-25, 0, -1]]) {
    const gl = new T.CylinderGeometry(4.5, 4.5, 9.7, 32, 1, true); gl.translate(cx, 0.3 + 4.85, cz); put('glass', gl);
    const wa = new T.CylinderGeometry(4.35, 4.35, 9.5, 24, 1, false); wa.translate(cx, 0.35 + 4.75, cz); put('water', wa);
    const rnd = kit.rnd(cx > 0 ? 11 : 13);
    for (let i = 0; i < 16; i++) {
      const a = rnd() * Math.PI * 2, r = 0.8 + rnd() * 3.0, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
      // the ride camera's lens rides the Kelp Line's own corridor (src/game/pipesCam.js), so nothing grows into its view:
      // no frond within 1.6 m of the line's foot run and riser (x 27.4, z −4.6 … −1.2), none taller than 8.0 m within 1.6 m
      // of its top run across the drum (to (26.05, 4.28) at the drum's rim), and none over 9.0 m anywhere (the top run's axis)
      if (kelpRun(sg * x, sg * z) < 1.6) continue;
      const top = kelpTop(sg * x, sg * z) < 1.6 ? 8.0 : 9.0;
      const h = Math.min(top - 1.0, 5.6 + rnd() * 2.4), f = frondGeo(T, h, rnd);
      f.rotateY(rnd() * Math.PI); f.translate(x, 0.4, z);
      // (streaming with the tide moves a frond by at most 1.08 m: scaled down near the line's corridor so its centre never
      // comes inside the 1.6 m the ride camera's lens keeps clear — tests/pipes.js's frond model holds while it streams)
      const clear = Math.min(kelpRun(sg * x, sg * z), top > 8.5 ? kelpTop(sg * x, sg * z) : Infinity) - 1.6;
      kelp.push({ g: f.index ? f.toNonIndexed() : f, base: 0.4, h, seed: rnd(), amp: Math.max(0, Math.min(1, clear / 1.1)), cx, cz });
    }
    // (70 always streaming, 160 more only in the flip's curtain)
    for (let i = 0; i < 230; i++) { const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 3.9; bubbles.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r, 0.06 + rnd() * 0.07, rnd(), 0.7 + rnd() * 0.6, i >= 70 ? 1 : 0]); }
  }
  // ---- merge per look
  const merge = (geos) => {
    if (!geos.length) return null;
    let n = 0; for (const g of geos) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let o = 0;
    const extra = ['color', 'aDense'].filter((k) => geos.every((g) => g.attributes[k]));
    const X = extra.map((k) => new Float32Array(n * geos[0].attributes[k].itemSize));
    for (const g of geos) { extra.forEach((k, j) => X[j].set(g.attributes[k].array, o * g.attributes[k].itemSize)); pos.set(g.attributes.position.array, o * 3); if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; }
    const m = new T.BufferGeometry(); m.setAttribute('position', new T.BufferAttribute(pos, 3)); m.setAttribute('normal', new T.BufferAttribute(nor, 3));
    extra.forEach((k, j) => m.setAttribute(k, new T.BufferAttribute(X[j], geos[0].attributes[k].itemSize)));
    m.computeBoundingSphere();
    return m;
  };
  // the deep water (the tanks, the drums, the Arch Tanks: dull, deep, clear round the tubes, thin from inside) and the
  // clear water (the Reef Windows, the bubble columns, the pools: shallow, lighter) in ONE mesh: the clear water's colour
  // and density ride on its vertices (one draw call)
  const tag = (geos, hex, dense) => { const c = new T.Color(hex); for (const g of geos) { const n = g.attributes.position.count, a = new Float32Array(n * 3), d = new Float32Array(n).fill(dense); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); g.setAttribute('color', new T.BufferAttribute(a, 3)); g.setAttribute('aDense', new T.BufferAttribute(d, 1)); } };
  tag(buckets.water, '#285865', 1.0); tag(buckets.clear, '#3d7480', 0.43);
  buckets.water.push(...buckets.clear); buckets.clear = [];
  const LOOK = { water: waterMaterial(T, U, TUBE_RUNS, true), glass: glassMaterial(T) };
  const objects = [];
  for (const [k, geos] of Object.entries(buckets)) {
    const g = merge(geos); if (!g) continue;
    const m = new T.Mesh(g, LOOK[k]); m.name = 'aq-' + k; m.renderOrder = k === 'glass' ? 2 : 1;
    objects.push(m);
  }
  const tide = tideDrums(T, kelp, bubbles, U.uNight);
  objects.push(...tide.objects);
  const gauges = tideGauges(T, merge);
  objects.push(...gauges.objects);
  // ---- what lives in the water, the jellies, the bubble columns, the penguins, the bathysphere, Feeding Time
  const rnd = kit.rnd(4242);
  const fishKinds = buildFish(T, rnd, U);
  objects.push(buildJellies(T, U, [[6.5, -17.0, 1.58, 0.37, 4.04], [-16.25, -2.9, 1.58, 0.37, 4.04], [-6.5, 17.0, 1.58, 0.37, 4.04], [16.25, 2.9, 1.58, 0.37, 4.04]]));
  objects.push(buildBubbleCols(T, U, rnd, [[0, -21.5, 1.2, 0.4, 5.6], [0, 21.5, 1.2, 0.4, 5.6]]));
  const spots = [[-12, -19.0, 0.3], [-9, -19.6, 0.3], [-5.5, -20.6, 0.3], [-1, -21.2, 0.3], [2.5, -19.4, 0.3], [9.5, -21.5, 0.3], [12.5, -19.2, 0.3], [15.5, -21.0, 0.3], [19, -19.4, 0.3], [23, -20.5, 0.3], [27, -19.0, 0.3]];
  objects.push(buildSwimmers(T, U, [...fishKinds, buildPenguins(T, rnd, U, W, spots, POOL)]));   // (every fish and penguin: one draw call)
  objects.push(buildExhibits(T, U, TOUCH));   // (the Reef Windows' reef and the touch pools' panels, both halves: one draw call)
  const krill = buildKrill(T, U, rnd); krill.visible = false;   // (drawn only in Feeding Time)
  objects.push(krill);
  const bathy = buildBathysphere(T);
  objects.push(bathy.group);
  const feed = feedingTime();
  bathy.group.userData.feeding = () => feed.state;   // (tests: Feeding Time's state; the clocks)
  bathy.group.userData.clocks = U;
  const far = buildFar(kit, { W });
  objects.push(...far.objects);
  // (on the environment's clock t: real time in play, the stepped clock in an audit — deterministic pictures and tests)
  let last = null;
  const animate = (t) => {
    const dt = last === null ? 0 : Math.min(0.1, Math.max(0, t - last)); last = t;
    const nowS = t, f = feed(nowS), night = U.uNight.value || 0;
    // (the tank glass reflects less of the bright sunset sky at dusk: it hazed the tanks pale over their glow — art round 2)
    LOOK.glass.envMapIntensity = 1.6 * (1 - 0.6 * night); LOOK.glass.opacity = 0.2 * (1 - 0.35 * night);
    U.uFT.value += dt; U.uFT2.value += dt * (1 + 1.8 * f.wheel); U.uKrill.value = f.krill; krill.visible = f.krill > 0.001;
    bathy.set(0.5 * f.bob, night);
    gauges.animate(t); tide.animate(t); far.animate(nowS, night);
  };
  return { static: far.static, plain: far.plain, terrain: [], instances: [], objects, animate };
}

// a giant-kelp frond: a thin stipe and, every 0.3 m up it (a golden-angle turn each), a gas bladder on a short stalk and
// a blade rising from it: an oval leaf, rounded at both ends (round round 2: still "pointed chevrons" — the blades were
// straight trapezoids tilted up, which read as arrow fletching), curling out and a little sideways, its edges ruffled,
// its colour olive at the stalk to gold at the tip. From y 0 to h + 0.4 (as before); every point within 0.255 m of the stipe's axis
// (tests/pipes.js's frond model: 0.28 m from the centre); non-indexed, per-vertex normals and colours
function frondGeo(T, h, rnd) {
  const P = [], N = [], C = [];
  const tri = (a, b, c) => { for (const v of [a, b, c]) { P.push(v.p[0], v.p[1], v.p[2]); N.push(v.n[0], v.n[1], v.n[2]); C.push(v.c, v.c * 0.98, v.c * 0.86); } };
  const V = (p, n, c) => ({ p, n, c });
  // the stipe: a square rod, 6 cm at its foot to 4 cm at its top, olive-brown
  const seg = 8;
  for (let i = 0; i < seg; i++) {
    const y0 = (h * i) / seg, y1 = (h * (i + 1)) / seg, r0 = 0.03 - 0.01 * (i / seg), r1 = 0.03 - 0.01 * ((i + 1) / seg);
    for (const [nx, nz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const tx = -nz, tz = nx, n = [nx, 0, nz];
      const a = V([nx * r0 + tx * r0, y0, nz * r0 + tz * r0], n, 0.62), b = V([nx * r0 - tx * r0, y0, nz * r0 - tz * r0], n, 0.62);
      const c = V([nx * r1 - tx * r1, y1, nz * r1 - tz * r1], n, 0.66), d = V([nx * r1 + tx * r1, y1, nz * r1 + tz * r1], n, 0.66);
      tri(a, b, c); tri(a, c, d);
    }
  }
  let ang = rnd() * 6.28;
  for (let y = 0.4; y < h - 0.1; y += 0.3) {
    ang += 2.4;
    const ca = Math.cos(ang), sa = Math.sin(ang), rad = [ca, sa], tan = [-sa, ca];
    const at = (r, t, yy) => [rad[0] * r + tan[0] * t, yy, rad[1] * r + tan[1] * t];
    // the gas bladder: a small spindle (an elongated octahedron) on the stipe
    { const r = 0.065, yb = y + 0.04, L = 0.06, w = 0.028;
      const top = at(r, 0, yb + L), bot = at(r, 0, yb - L), ring = [at(r + w, 0, yb), at(r, w, yb), at(r - w, 0, yb), at(r, -w, yb)];
      const nr = [[rad[0], 0, rad[1]], [tan[0], 0, tan[1]], [-rad[0], 0, -rad[1]], [-tan[0], 0, -tan[1]]];
      for (let k = 0; k < 4; k++) { const k2 = (k + 1) % 4, n = [(nr[k][0] + nr[k2][0]) / 2, 0, (nr[k][2] + nr[k2][2]) / 2]; tri(V(top, [0, 1, 0], 1.25), V(ring[k], nr[k], 1.15), V(ring[k2], nr[k2], 1.15)); tri(V(bot, [0, -1, 0], 1.05), V(ring[k2], nr[k2], 1.15), V(ring[k], nr[k], 1.15)); void n; }
    }
    // the blade: its centreline from the bladder up and out (r 0.08 → 0.23), curling a little sideways; an oval outline
    const L = Math.min(0.5 + 0.22 * rnd(), h + 0.3 - y), Wd = 0.06 + 0.02 * rnd(), curl = (rnd() - 0.5) * 0.08, ns = 10;
    if (L < 0.25) continue;
    const cl = (t) => [0.08 + 0.15 * Math.pow(t, 0.85), curl * Math.sin(Math.PI * t), y + 0.1 + L * t];
    const rows = [];
    for (let k = 0; k <= ns; k++) {
      // (rows closer together toward both ends, a superellipse outline: blunt, rounded ends — no point)
      const t = 0.5 - 0.5 * Math.cos((Math.PI * k) / ns), [r, tc, yy] = cl(t), w = Wd * Math.pow(Math.max(0, 1 - Math.abs(2 * t - 1) ** 2.4), 1 / 2.4) + (k === 0 || k === ns ? 0.004 : 0);
      const ruff = 0.018 * Math.sin(t * 9 + ang * 3);
      const col = 0.82 + 0.4 * t;
      // the surface faces out (radially) and a little down; the ruffled edges tilt their normals
      const n0 = [rad[0] * 0.9, -0.3, rad[1] * 0.9];
      rows.push([
        V(at(r + ruff, tc - w, yy + 0.02 * Math.cos(t * 7)), [n0[0] - tan[0] * 0.35, n0[1], n0[2] - tan[1] * 0.35], col * 0.96),
        V(at(r, tc, yy), n0, col),
        V(at(r - ruff, tc + w, yy - 0.02 * Math.cos(t * 7)), [n0[0] + tan[0] * 0.35, n0[1], n0[2] + tan[1] * 0.35], col * 0.96),
      ]);
    }
    for (let k = 0; k < ns; k++) for (let e = 0; e < 2; e++) { const a = rows[k][e], b = rows[k][e + 1], c = rows[k + 1][e + 1], d = rows[k + 1][e]; tri(a, b, c); tri(a, c, d); }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('normal', new T.BufferAttribute(new Float32Array(N), 3));
  g.setAttribute('color', new T.BufferAttribute(new Float32Array(C), 3));
  return g;
}

// ---- the tide in the kelp drums (DESIGN.md §3.3 / §3.4: one of the five ways the tide is shown; LEAD-REVIEW round 2,
// item 5): UP, the fronds stand tall and their ripples run up them, and a column of bubbles rises through each drum; DOWN,
// the fronds' tops bow over inward and down, their ripples run down, and the bubbles sink. At the flip the fronds swing
// over (1.5 s) and the bubbles roar through the drum at four times their pace for 1.5 s (the curtain). Looks only, in the
// vertex shaders: two meshes, no per-frame upload — the stream and the bubbles' travel are uniforms.
function tideDrums(T, kelp, bubbles, uNight = { value: 0 }) {
  const U = { uTime: { value: 0 }, uStream: { value: 1 }, uPhase: { value: 0 }, uBurst: { value: 0 }, uNightK: uNight };
  // the fronds: aK (0 at the root … 1 at the tip), aS (a seed), aA (how far this one may move), aC (its drum's centre)
  let n = 0; for (const f of kelp) n += f.g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), aK = new Float32Array(n), aS = new Float32Array(n), aA = new Float32Array(n), aC = new Float32Array(n * 2);
  let o = 0;
  for (const f of kelp) {
    const P = f.g.attributes.position.array, N = f.g.attributes.normal.array, c = P.length / 3;
    pos.set(P, o * 3); nor.set(N, o * 3); col.set(f.g.attributes.color.array, o * 3);
    for (let i = 0; i < c; i++) { aK[o + i] = Math.max(0, Math.min(1, (P[i * 3 + 1] - f.base) / f.h)); aS[o + i] = f.seed; aA[o + i] = f.amp; aC[(o + i) * 2] = f.cx; aC[(o + i) * 2 + 1] = f.cz; }
    o += c;
  }
  const kg = new T.BufferGeometry();
  kg.setAttribute('position', new T.BufferAttribute(pos, 3)); kg.setAttribute('normal', new T.BufferAttribute(nor, 3)); kg.setAttribute('color', new T.BufferAttribute(col, 3));
  kg.setAttribute('aK', new T.BufferAttribute(aK, 1)); kg.setAttribute('aS', new T.BufferAttribute(aS, 1)); kg.setAttribute('aA', new T.BufferAttribute(aA, 1)); kg.setAttribute('aC', new T.BufferAttribute(aC, 2));
  kg.computeBoundingSphere(); kg.boundingSphere.radius += 2;
  const km = new T.MeshStandardMaterial({ color: '#8a8238', vertexColors: true, roughness: 0.62, metalness: 0.0, side: T.DoubleSide, emissive: '#1d1b08' });
  km.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    // (white-lit kelp at dusk: the drum's light from below, DESIGN.md §5.7; stronger since art round 2 — with the glass's
    // sunset haze gone the drums read as lit tanks of gold kelp, not pale water; the gold tips brightest)
    sh.fragmentShader = 'uniform float uNightK;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(0.55, 0.52, 0.34) * uNightK * 0.95 * vColor.g;');
    sh.vertexShader = 'attribute float aK; attribute float aS; attribute float aA; attribute vec2 aC; uniform float uTime; uniform float uStream;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
  {
    // the ripple runs up the frond on UP (uStream +1), down it on DOWN (−1); DOWN also bows the top inward and down
    float down = clamp(0.5 - 0.5 * uStream, 0.0, 1.0), k = aK;
    float a0 = aS * 6.2832, wv = sin(a0 + k * 4.2 - uStream * uTime * 2.6);
    vec2 side = vec2(cos(a0), sin(a0)), inw = normalize(aC - transformed.xz + vec2(1e-4));
    vec2 off = side * (wv * 0.18 * k) + inw * (down * k * k * 0.9);
    transformed.xz += off * aA;
    transformed.y -= down * k * k * 1.1;
  }`);
  };
  km.customProgramCacheKey = () => 'aq-kelp-tide';
  const kmesh = new T.Mesh(kg, km); kmesh.name = 'aq-kelp';
  // the bubbles: round camera-facing sprites (looks.js bubbleQuads), carried round the drum's height by uPhase (rising when
  // it grows); a range of sizes, a little transparent (art round 1: they were white diamond confetti)
  const bgeo = bubbleQuads(T, bubbles.map(([x, z, r, seed, sp, cur]) => ({ x, z, r: r * 0.85, a: [[seed, sp, cur]] })), [['aB', 3]]);
  bgeo.boundingSphere = new T.Sphere(new T.Vector3(0, 5, 0), 32);
  const bm = new T.MeshBasicMaterial({ color: '#e6f8fc', transparent: true, opacity: 0.85, depthWrite: false });
  const bfs = BUBBLE_FS();
  bm.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = 'attribute vec3 aB; uniform float uTime; uniform float uPhase; uniform float uBurst;\n' + BUBBLE_VS_PARS + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
  // (the curtain's bubbles exist only in the burst; every bubble swells in it)
  float bubScale = (aB.z > 0.5 ? uBurst : 1.0) * (1.0 + 0.6 * uBurst);
  transformed.y += 0.6 + mod(aB.x * 8.8 + uPhase * aB.y, 8.8);
  transformed.x += 0.07 * sin(uTime * 3.1 + aB.x * 41.0); transformed.z += 0.07 * cos(uTime * 2.7 + aB.x * 37.0);`).replace('#include <project_vertex>', BUBBLE_VS_PROJECT);
    sh.fragmentShader = bfs.pars + sh.fragmentShader.replace('#include <color_fragment>', bfs.body);
  };
  bm.customProgramCacheKey = () => 'aq-bubbles-tide2';
  const bmesh = new T.Mesh(bgeo, bm); bmesh.name = 'aq-bubbles'; bmesh.renderOrder = 1; bmesh.frustumCulled = false;
  let stream = 1, last = performance.now() / 1000, dirWas = null, burst = 0;
  const animate = (t) => {
    const nowS = performance.now() / 1000, dt = Math.min(0.1, Math.max(0, nowS - last)); last = nowS;
    const f = G.match?.pipes?.flow?.() || { dir: 'ab' }, want = f.dir === 'ab' ? 1 : -1;
    if (dirWas !== null && f.dir !== dirWas) burst = 1.5;   // (the flip: the curtain)
    dirWas = f.dir;
    stream += (want - stream) * Math.min(1, dt * 2.2);
    burst = Math.max(0, burst - dt);
    U.uTime.value = t; U.uStream.value = stream; U.uBurst.value = Math.min(1, burst * 1.6);
    U.uPhase.value += dt * 1.5 * stream * (1 + 3 * Math.min(1, burst));
  };
  animate(0);
  return { objects: [kmesh, bmesh], animate };
}

// ---- the Tide Gauges: two per gatehouse on its crest (x ±4.5, centre 10.8 m, on the Arch Tank's lid), Ø 2.4 brass,
// double-faced (the court and the wing). The needle points to ▲ UP or ▼ DOWN; from T − 10 a red sector of ten segments
// counts down (one goes out each second), the needle trembles, and at the flip it swings over. Twins: Bravo's gatehouse.
export const GAUGES = [[4.5, 10.8, -25], [-4.5, 10.8, -25], [-4.5, 10.8, 25], [4.5, 10.8, 25]];
function tideGauges(T, merge) {
  const R = 1.2, faces = [];
  for (const [x, y, z] of GAUGES) for (const side of [1, -1]) faces.push({ x, y, z: z + side * 0.13, yaw: side > 0 ? 0 : Math.PI });
  // the brass: rims, the post down to the tank lid (9.0), the hub caps
  const brass = [];
  for (const [x, y, z] of GAUGES) {
    const rim = new T.TorusGeometry(R, 0.1, 8, 40); rim.translate(x, y, z); brass.push(rim);
    const body = new T.CylinderGeometry(R - 0.02, R - 0.02, 0.24, 40, 1, true); body.rotateX(Math.PI / 2); body.translate(x, y, z); brass.push(body);
    const post = new T.BoxGeometry(0.22, y - R - 9.0 + 0.1, 0.22); post.translate(x, 9.0 + (y - R - 9.0 + 0.1) / 2, z); brass.push(post);
  }
  const brassMesh = new T.Mesh(merge(brass.map((g) => (g.index ? g.toNonIndexed() : g))), new T.MeshStandardMaterial({ color: '#a8895a', roughness: 0.35, metalness: 0.7, side: T.DoubleSide }));
  brassMesh.name = 'aq-gauge-brass';
  // the faces: one canvas (▲ UP over, ▼ DOWN under, the ticks), every face a disc of it
  const cv = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  let tex = null;
  if (cv) {
    cv.width = cv.height = 256;
    const c = cv.getContext('2d');
    c.fillStyle = '#f4efe1'; c.beginPath(); c.arc(128, 128, 126, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#2c2a30'; c.lineWidth = 3;
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, r0 = i % 6 ? 108 : 98; c.beginPath(); c.moveTo(128 + Math.cos(a) * r0, 128 + Math.sin(a) * r0); c.lineTo(128 + Math.cos(a) * 120, 128 + Math.sin(a) * 120); c.stroke(); }
    // (the words sit inside a ring the needle's tip and the red countdown band never reach: the needle stops 46 px out,
    // the words start at 47; the band runs round the rim from 106 px — before, both covered ▲ UP and TIDE in the warning,
    // so the only word left legible was DOWN: LEAD-REVIEW round 2, item 4)
    c.fillStyle = '#15121c'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = '900 34px Rubik, "Helvetica Neue", Arial, sans-serif'; c.fillText('▲ UP', 128, 64); c.fillText('▼ DOWN', 128, 192);
    c.font = '800 15px Rubik, "Helvetica Neue", Arial, sans-serif'; c.fillText('KELP', 76, 120); c.fillText('TIDE', 76, 137);
    tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace;
  }
  const discs = faces.map((f) => { const g = new T.CircleGeometry(R - 0.04, 40).toNonIndexed(); g.rotateY(f.yaw); g.translate(f.x, f.y, f.z); return g; });
  const faceGeo = merge(discs);
  // (the merge keeps position + normal only: give the discs their uvs back)
  { const uv = []; for (const f of faces) { const g = new T.CircleGeometry(R - 0.04, 40); const gn = g.toNonIndexed(); const u = gn.attributes.uv.array; for (let i = 0; i < u.length; i += 2) uv.push(u[i], u[i + 1]); void f; } faceGeo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); }
  const faceMesh = new T.Mesh(faceGeo, new T.MeshBasicMaterial({ map: tex, color: tex ? '#ffffff' : '#f4efe1' }));
  faceMesh.name = 'aq-gauge-face';
  // the needles (instanced) and the red countdown segments (instanced: ten per face round its right half)
  // the needle: a shaft and an arrowhead, pointing up its local +y
  // (short: its tip stops 0.42 m out, under the words it points at; a counterweight tail behind the hub)
  const ng = (() => { const sh = new T.BoxGeometry(0.09, 0.42, 0.04).toNonIndexed(); sh.translate(0, 0.1, 0); const hd = new T.ConeGeometry(0.15, 0.18, 3).toNonIndexed(); hd.translate(0, 0.33, 0); const hub = new T.CylinderGeometry(0.1, 0.1, 0.05, 12).toNonIndexed(); hub.rotateX(Math.PI / 2); return merge([sh, hd, hub]); })();
  const needles = new T.InstancedMesh(ng, new T.MeshBasicMaterial({ color: '#15121c' }), faces.length);
  needles.name = 'aq-gauge-needle';
  const sg = new T.RingGeometry(0.98, 1.14, 4, 1, 0, (16 * Math.PI) / 180);   // (the rim band, outside the words)
  const segs = new T.InstancedMesh(sg, new T.MeshBasicMaterial({ color: '#d8202c', side: T.DoubleSide, toneMapped: false }), faces.length * 10);
  segs.name = 'aq-gauge-red';
  const m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), p = new T.Vector3(), s1 = new T.Vector3(1, 1, 1), s0 = new T.Vector3(1e-4, 1e-4, 1e-4);
  let ang = 0, shown = -1;
  const animate = () => {
    const f = G.match?.pipes?.flow?.() || { dir: 'ab', phase: 'run', left: Infinity };
    const up = f.dir === 'ab', warn = Number.isFinite(f.left) && f.left <= 10 && f.left > 0;
    // the needle: at ▲ (0) or ▼ (π); trembles in the warning; swings over at the flip (damped toward its target)
    const want = up ? 0 : Math.PI, t = performance.now() / 1000;
    ang += (want - ang) * 0.08;
    const a = ang + (warn ? 0.06 * Math.sin(t * 31) : 0);
    faces.forEach((F, i) => {
      // the needle turns about the face's normal; ▲ is up the face
      q.setFromEuler(e.set(0, F.yaw, F.yaw ? a : -a, 'YXZ'));
      p.set(F.x + Math.sin(F.yaw) * 0.03, F.y, F.z + Math.cos(F.yaw) * 0.03);
      m4.compose(p, q, s1); needles.setMatrixAt(i, m4);
    });
    needles.instanceMatrix.needsUpdate = true;
    segs.visible = warn;   // (drawn only in the warning: no draw call the rest of the time)
    const k = warn ? Math.ceil(f.left) : 0;
    if (k !== shown) {
      shown = k;
      faces.forEach((F, i) => {
        for (let j = 0; j < 10; j++) {
          // segment j spans 18° from the top round the right half (as seen from its side); lit while j < k
          const th = Math.PI / 2 - (j + 1) * (18 * Math.PI) / 180 + (1 * Math.PI) / 180;
          q.setFromEuler(e.set(0, F.yaw, F.yaw ? Math.PI - th - (16 * Math.PI) / 180 : th, 'YXZ'));
          p.set(F.x + Math.sin(F.yaw) * 0.02, F.y, F.z + Math.cos(F.yaw) * 0.02);
          m4.compose(p, q, j < k ? s1 : s0); segs.setMatrixAt(i * 10 + j, m4);
        }
      });
      segs.instanceMatrix.needsUpdate = true;
    }
  };
  animate();
  return { objects: [brassMesh, faceMesh, needles, segs], animate };
}
