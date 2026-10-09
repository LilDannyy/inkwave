// Gulper Aquarium — the stage's own looks outside the level geometry (layout.env.backdrop; see the top of
// src/world/environment.js). Gets the environment's SCENERY_KIT (+ THREE, bounds, runs, rnd, sceneryMaterial) — it
// imports nothing that imports three, so layout.js stays importable in Node.
//
// BLOCKOUT: no far scenery yet (the art pass). What this draws is the stage's glass and water as placeholder volumes —
// the level blocks for them are hidden colliders (layout.js `glass`) — and the kelp in the drums. The Tubeway itself
// (the clear tubes, mouths, fans, flaps, signs, chevrons, floor arrows) is the pipe engine's (src/game/pipes.js +
// src/fx/pipesFx.js). The stage's own world cue for the tide is here: the four Tide Gauges (two per gatehouse on its crest
// at x ±4.5, centre 10.8 m, Ø 2.4 brass, double-faced to the court and the wing): a needle between ▲ UP and ▼ DOWN and a
// red 10 s countdown sector, driven by the pipe engine's tide (G.match.pipes.flow(), a pure function of the stage clock).
import { G } from '../../../core/ctx.js';

export function buildBackdrop(kit, data = {}) {
  const T = kit.THREE, DEG = Math.PI / 180;
  const buckets = { glass: [], water: [] };
  const put = (k, g) => buckets[k].push(g.index ? g.toNonIndexed() : g);
  // ---- glass panels and water volumes (from the layout's hidden glass pieces, both halves)
  for (const d of data.glass || []) {
    if (d.tag === 'drum-glass' || d.tag === 'bathysphere') continue;
    let g;
    if (d.kind === 'box') { g = new T.BoxGeometry(d.max[0] - d.min[0], d.max[1] - d.min[1], d.max[2] - d.min[2]); g.translate((d.min[0] + d.max[0]) / 2, (d.min[1] + d.max[1]) / 2, (d.min[2] + d.max[2]) / 2); }
    else if (d.kind === 'obox') { g = new T.BoxGeometry(d.size[0], d.size[1], d.size[2]); g.rotateY(d.rotY * DEG); g.translate(d.center[0], d.center[1], d.center[2]); }
    else continue;
    if (d.tag === 'arch-tank') { const w = g.clone(); w.scale(0.98, 0.96, 0.98); put('water', w); }
    put('glass', g);
  }
  // the Great Tank's water (a 16-gon prism inside its glass, down to the sunk sand bed)
  const tank = data.tank || { a: 7.5 };
  { const g = new T.CylinderGeometry((tank.a - 0.3) / Math.cos(Math.PI / 16), (tank.a - 0.3) / Math.cos(Math.PI / 16), 2.7, 16, 1, false, 78.75 * DEG); g.translate(0, 0.75, 0); put('water', g); }
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
      const h = Math.min(top - 0.4, 6 + rnd() * 2.6), f = new T.BoxGeometry(0.12, h, 0.55, 1, 10, 1);
      f.rotateY(rnd() * Math.PI); f.translate(x, 0.4 + h / 2, z);
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
    for (const g of geos) { pos.set(g.attributes.position.array, o * 3); if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; }
    const m = new T.BufferGeometry(); m.setAttribute('position', new T.BufferAttribute(pos, 3)); m.setAttribute('normal', new T.BufferAttribute(nor, 3)); m.computeBoundingSphere();
    return m;
  };
  const std = (c, o = {}) => new T.MeshStandardMaterial({ color: c, roughness: 0.25, metalness: 0.05, ...o });
  const see = (c, op, o = {}) => std(c, { transparent: true, opacity: op, depthWrite: false, side: T.DoubleSide, ...o });
  const LOOK = {
    water: new T.MeshBasicMaterial({ color: '#2a5f6c', transparent: true, opacity: 0.72, depthWrite: false, side: T.DoubleSide }), glass: see('#d9eef0', 0.14, { roughness: 0.05 }),
  };
  const objects = [];
  for (const [k, geos] of Object.entries(buckets)) {
    const g = merge(geos); if (!g) continue;
    const m = new T.Mesh(g, LOOK[k]); m.name = 'aq-' + k; m.renderOrder = k === 'water' ? 1 : k === 'glass' ? 2 : 0;
    objects.push(m);
  }
  const tide = tideDrums(T, kelp, bubbles);
  objects.push(...tide.objects);
  const gauges = tideGauges(T, merge);
  objects.push(...gauges.objects);
  return { static: [], plain: [], terrain: [], instances: [], objects, animate: (t) => { gauges.animate(t); tide.animate(t); } };
}

// ---- the tide in the kelp drums (DESIGN.md §3.3 / §3.4: one of the five ways the tide is shown; LEAD-REVIEW round 2,
// item 5): UP, the fronds stand tall and their ripples run up them, and a column of bubbles rises through each drum; DOWN,
// the fronds' tops bow over inward and down, their ripples run down, and the bubbles sink. At the flip the fronds swing
// over (1.5 s) and the bubbles roar through the drum at four times their pace for 1.5 s (the curtain). Looks only, in the
// vertex shaders: two meshes, no per-frame upload — the stream and the bubbles' travel are uniforms.
function tideDrums(T, kelp, bubbles) {
  const U = { uTime: { value: 0 }, uStream: { value: 1 }, uPhase: { value: 0 }, uBurst: { value: 0 } };
  // the fronds: aK (0 at the root … 1 at the tip), aS (a seed), aA (how far this one may move), aC (its drum's centre)
  let n = 0; for (const f of kelp) n += f.g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), aK = new Float32Array(n), aS = new Float32Array(n), aA = new Float32Array(n), aC = new Float32Array(n * 2);
  let o = 0;
  for (const f of kelp) {
    const P = f.g.attributes.position.array, N = f.g.attributes.normal.array, c = P.length / 3;
    pos.set(P, o * 3); nor.set(N, o * 3);
    for (let i = 0; i < c; i++) { aK[o + i] = Math.max(0, Math.min(1, (P[i * 3 + 1] - f.base) / f.h)); aS[o + i] = f.seed; aA[o + i] = f.amp; aC[(o + i) * 2] = f.cx; aC[(o + i) * 2 + 1] = f.cz; }
    o += c;
  }
  const kg = new T.BufferGeometry();
  kg.setAttribute('position', new T.BufferAttribute(pos, 3)); kg.setAttribute('normal', new T.BufferAttribute(nor, 3));
  kg.setAttribute('aK', new T.BufferAttribute(aK, 1)); kg.setAttribute('aS', new T.BufferAttribute(aS, 1)); kg.setAttribute('aA', new T.BufferAttribute(aA, 1)); kg.setAttribute('aC', new T.BufferAttribute(aC, 2));
  kg.computeBoundingSphere(); kg.boundingSphere.radius += 2;
  const km = new T.MeshStandardMaterial({ color: '#5b5a33', roughness: 0.8, metalness: 0.05, side: T.DoubleSide });
  km.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
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
  // the bubbles: one small octahedron each, carried round the drum's height by uPhase (rising when it grows)
  const bg = [], bA = [];
  const bP = [];   // (an octahedron is already non-indexed: no toNonIndexed, which warns)
  for (const [x, z, r, seed, sp, cur] of bubbles) { const g = new T.OctahedronGeometry(r, 0); g.translate(x, 0, z); bg.push(g); for (let i = 0; i < g.attributes.position.count; i++) { bA.push(seed, sp, cur); bP.push(x, z); } }
  let m = 0; for (const g of bg) m += g.attributes.position.count;
  const bp = new Float32Array(m * 3); o = 0; for (const g of bg) { bp.set(g.attributes.position.array, o * 3); o += g.attributes.position.count; }
  const bgeo = new T.BufferGeometry(); bgeo.setAttribute('position', new T.BufferAttribute(bp, 3)); bgeo.setAttribute('aB', new T.BufferAttribute(new Float32Array(bA), 3)); bgeo.setAttribute('aP', new T.BufferAttribute(new Float32Array(bP), 2));
  bgeo.boundingSphere = new T.Sphere(new T.Vector3(0, 5, 0), 32);
  const bm = new T.MeshBasicMaterial({ color: '#eefcff', transparent: true, opacity: 0.7, depthWrite: false });
  bm.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = 'attribute vec3 aB; attribute vec2 aP; uniform float uTime; uniform float uPhase; uniform float uBurst;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
  // (the curtain's bubbles exist only in the burst; every bubble swells in it)
  float bs = (aB.z > 0.5 ? uBurst : 1.0) * (1.0 + 0.6 * uBurst);
  transformed = vec3(aP.x + (transformed.x - aP.x) * bs, transformed.y * bs, aP.y + (transformed.z - aP.y) * bs);
  transformed.y += 0.6 + mod(aB.x * 8.8 + uPhase * aB.y, 8.8);
  transformed.x += 0.07 * sin(uTime * 3.1 + aB.x * 41.0); transformed.z += 0.07 * cos(uTime * 2.7 + aB.x * 37.0);`);
  };
  bm.customProgramCacheKey = () => 'aq-bubbles-tide';
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
