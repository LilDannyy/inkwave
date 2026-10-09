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
  const buckets = { glass: [], water: [], kelp: [] };
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
  // the kelp drums: glass cylinders, water, kelp fronds (thinned to clear water round the Kelp Line's riser)
  for (const [cx, cz, sg] of [[25, 0, 1], [-25, 0, -1]]) {
    const gl = new T.CylinderGeometry(4.5, 4.5, 9.7, 32, 1, true); gl.translate(cx, 0.3 + 4.85, cz); put('glass', gl);
    const wa = new T.CylinderGeometry(4.35, 4.35, 9.5, 24, 1, false); wa.translate(cx, 0.35 + 4.75, cz); put('water', wa);
    const rnd = kit.rnd(cx > 0 ? 11 : 13);
    for (let i = 0; i < 16; i++) {
      const a = rnd() * Math.PI * 2, r = 0.8 + rnd() * 3.0, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
      if (Math.hypot(x - sg * 27.4, z + sg * 1.2) < 1.6) continue;
      const h = 6 + rnd() * 3.3, f = new T.BoxGeometry(0.12, h, 0.55); f.rotateY(rnd() * Math.PI); f.translate(x, 0.4 + h / 2, z); put('kelp', f);
    }
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
    water: new T.MeshBasicMaterial({ color: '#2a5f6c', transparent: true, opacity: 0.72, depthWrite: false, side: T.DoubleSide }), glass: see('#d9eef0', 0.14, { roughness: 0.05 }), kelp: std('#5b5a33', { roughness: 0.8 }),
  };
  const objects = [];
  for (const [k, geos] of Object.entries(buckets)) {
    const g = merge(geos); if (!g) continue;
    const m = new T.Mesh(g, LOOK[k]); m.name = 'aq-' + k; m.renderOrder = k === 'water' ? 1 : k === 'glass' ? 2 : 0;
    objects.push(m);
  }
  const gauges = tideGauges(T, merge);
  objects.push(...gauges.objects);
  return { static: [], plain: [], terrain: [], instances: [], objects, animate: (t) => gauges.animate(t) };
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
    c.fillStyle = '#15121c'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = '900 44px Rubik, "Helvetica Neue", Arial, sans-serif'; c.fillText('▲ UP', 128, 58); c.fillText('▼ DOWN', 128, 200);
    c.font = '800 17px Rubik, "Helvetica Neue", Arial, sans-serif'; c.fillText('KELP LINES', 70, 128); c.fillText('TIDE', 190, 128);
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
  const ng = (() => { const sh = new T.BoxGeometry(0.09, 0.62, 0.04).toNonIndexed(); sh.translate(0, 0.28, 0); const hd = new T.ConeGeometry(0.17, 0.32, 3).toNonIndexed(); hd.translate(0, 0.74, 0); const hub = new T.CylinderGeometry(0.1, 0.1, 0.05, 12).toNonIndexed(); hub.rotateX(Math.PI / 2); return merge([sh, hd, hub]); })();
  const needles = new T.InstancedMesh(ng, new T.MeshBasicMaterial({ color: '#15121c' }), faces.length);
  needles.name = 'aq-gauge-needle';
  const sg = new T.RingGeometry(0.62, 0.92, 4, 1, 0, (16 * Math.PI) / 180);
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
