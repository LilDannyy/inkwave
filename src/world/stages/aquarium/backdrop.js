// Gulper Aquarium — the stage's own looks outside the level geometry (layout.env.backdrop; see the top of
// src/world/environment.js). Gets the environment's SCENERY_KIT (+ THREE, bounds, runs, rnd, sceneryMaterial) — it
// imports nothing that imports three, so layout.js stays importable in Node.
//
// BLOCKOUT: no far scenery yet (the art pass). What this draws now is the stage's glass and water as placeholder
// volumes — the level blocks for them are hidden colliders (layout.js `glass`) — and the Tubeway as placeholder clear
// tubes along the legs' real centrelines (tubeway.js) with their mouths: a white ring at a two-way end, green at an
// IN end, red at an OUT end, chevrons along the one-way legs pointing with the flow; on the floor, an arrow on each IN
// end's apron (white at a two-way end) and a ring round each OUT end's landing point (red; white at a two-way end).
// The Kelp Lines' tide (UP / DOWN) swaps their rings and chevrons: globalThis.__aqTide = 'down' shows the DOWN state
// (the pipe engine will own this; the blockout's pictures set it by hand).
import { PIPES, allLegs, centreline, endsOf } from './tubeway.js';

export function buildBackdrop(kit, data = {}) {
  const T = kit.THREE, DEG = Math.PI / 180;
  const buckets = { glass: [], water: [], kelp: [], tube: [], two: [], in: [], out: [], upIn: [], upOut: [], dnIn: [], dnOut: [], chev: [], upChev: [], dnChev: [],
    apTwo: [], landTwo: [], apIn: [], landOut: [], upApIn: [], upLandOut: [], dnApIn: [], dnLandOut: [], spine: [], rider: [], riderGlow: [] };
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
  // ---- the Tubeway: tubes, mouths, chevrons, landing discs
  const UP = new T.Vector3(0, 1, 0);
  for (const leg of allLegs(PIPES)) {
    const pts = centreline(leg).map((p) => new T.Vector3(p[0], p[1], p[2]));
    const path = new T.CurvePath();
    for (let i = 1; i < pts.length; i++) if (pts[i].distanceTo(pts[i - 1]) > 1e-4) path.add(new T.LineCurve3(pts[i - 1], pts[i]));
    put('tube', new T.TubeGeometry(path, Math.max(8, pts.length * 2), 0.88, 12, false));
    const tidal = typeof leg.way === 'object', two = leg.way === 'two';
    for (const e of endsOf(leg)) {
      const ring = new T.TorusGeometry(0.98, 0.1, 8, 28);
      const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 0, 1), new T.Vector3(e.out[0], e.out[1], e.out[2]));
      ring.applyQuaternion(q); ring.translate(e.pos[0] + e.out[0] * 0.05, e.pos[1], e.pos[2] + e.out[2] * 0.05);
      if (two) put('two', ring);
      else if (!tidal) put(e.k === 0 ? 'in' : 'out', ring);
      else { put(e.k === 0 ? 'upIn' : 'upOut', ring); put(e.k === 0 ? 'dnOut' : 'dnIn', ring.clone()); }
      // floor marks, legible from the top camera: an arrow on the IN end's apron (2.4 wide, 0.2 … 2.2 m out, pointing
      // into the mouth) and a ring round the OUT end's landing point (3.1 m out); white at a two-way end
      const yaw = Math.atan2(e.out[0], e.out[2]);
      const arrow = new T.Shape([[-1.2, 2.2], [1.2, 2.2], [1.2, 1.0], [0, 0.2], [-1.2, 1.0]].map(([x, y]) => new T.Vector2(x, y)));
      const ap = new T.ShapeGeometry(arrow); ap.rotateX(-Math.PI / 2); ap.rotateY(yaw + Math.PI); ap.translate(e.pos[0], e.floorY + 0.05, e.pos[2]);
      const lr = new T.RingGeometry(0.85, 1.3, 24); lr.rotateX(-Math.PI / 2); lr.translate(e.land[0], e.land[1] + 0.05, e.land[2]);
      if (two) { put('apTwo', ap); put('landTwo', lr); }
      else if (!tidal) { if (e.k === 0) put('apIn', ap); else put('landOut', lr); }
      else if (e.k === 0) { put('upApIn', ap); put('dnLandOut', lr); }
      else { put('dnApIn', ap); put('upLandOut', lr); }
    }
    // the Express's sea-green steel spine along the top of its overhead runs (DESIGN.md §5.1) and a lattice strut
    // where the span bends over the Pump Hall roof; a rider (team colour, its 6 m glow) shown with globalThis.__aqRider
    if (leg.id.startsWith('express')) {
      const P = leg.pts;
      for (let i = 0; i + 1 < P.length; i++) {
        const a = P[i], b = P[i + 1];
        if (a[1] !== b[1] || a[1] < 6) continue;
        const dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz), sp = new T.BoxGeometry(L - 2.0, 0.22, 0.34);
        sp.rotateY(-Math.atan2(dz, dx)); sp.translate((a[0] + b[0]) / 2, a[1] + 0.95, (a[2] + b[2]) / 2); put('spine', sp);
        if (i + 2 < P.length && P[i + 2][1] === a[1]) { const y0 = 6.4, st = new T.BoxGeometry(0.5, b[1] - 0.85 - y0, 0.5); st.translate(b[0], y0 + (b[1] - 0.85 - y0) / 2, b[2]); put('spine', st); }
      }
      const L = path.getLength(), at = 0.38 * L;
      const p = path.getPointAt(at / L), rb = new T.SphereGeometry(0.45, 14, 10); rb.translate(p.x, p.y, p.z); put('rider', rb);
      const seg = new T.CurvePath(); for (let k = 0; k < 12; k++) { const u0 = Math.max(0, at - 6 + k * 0.5) / L, u1 = Math.max(0, at - 6 + (k + 1) * 0.5) / L; seg.add(new T.LineCurve3(path.getPointAt(u0), path.getPointAt(u1))); }
      put('riderGlow', new T.TubeGeometry(seg, 24, 0.9, 12, false));
    }
    if (!two) {   // chevrons every 2.5 m along the leg (not in its first / last 3 m), pointing with the flow
      const L = path.getLength();
      for (let s = 3; s < L - 3; s += 2.5) {
        const p = path.getPointAt(s / L), t = path.getTangentAt(s / L);
        for (const [key, dir] of tidal ? [['upChev', 1], ['dnChev', -1]] : [['chev', 1]]) {
          const c = new T.ConeGeometry(0.5, 1.1, 10); c.applyQuaternion(new T.Quaternion().setFromUnitVectors(UP, t.clone().multiplyScalar(dir))); c.translate(p.x, p.y, p.z);
          put(key, c);
        }
      }
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
  const glow = (c) => new T.MeshBasicMaterial({ color: c });
  const LOOK = {
    water: new T.MeshBasicMaterial({ color: '#2a5f6c', transparent: true, opacity: 0.72, depthWrite: false, side: T.DoubleSide }), glass: see('#d9eef0', 0.14, { roughness: 0.05 }), kelp: std('#5b5a33', { roughness: 0.8 }),
    tube: see('#eef8f8', 0.3, { roughness: 0.05 }), two: glow('#f4f1e8'), in: glow('#3cc46a'), out: glow('#c8402f'),
    chev: glow('#3cc46a'), upIn: glow('#3cc46a'), upOut: glow('#c8402f'), dnIn: glow('#3cc46a'), dnOut: glow('#c8402f'), upChev: glow('#3cc46a'), dnChev: glow('#3cc46a'),
    apTwo: glow('#f4f1e8'), landTwo: glow('#f4f1e8'), apIn: glow('#3cc46a'), landOut: glow('#c8402f'),
    upApIn: glow('#3cc46a'), upLandOut: glow('#c8402f'), dnApIn: glow('#3cc46a'), dnLandOut: glow('#c8402f'),
    spine: std('#6e978a', { roughness: 0.6, metalness: 0.3 }), rider: glow('#ff3d8e'), riderGlow: see('#ff3d8e', 0.35),
  };
  const objects = [], groups = { up: [], down: [], rider: [] };
  for (const [k, geos] of Object.entries(buckets)) {
    const g = merge(geos); if (!g) continue;
    const m = new T.Mesh(g, LOOK[k]); m.name = 'aq-' + k; m.renderOrder = k === 'water' ? 1 : k === 'glass' || k === 'tube' || k === 'riderGlow' ? 2 : 0;
    if (k.startsWith('up')) groups.up.push(m); else if (k.startsWith('dn')) groups.down.push(m); else if (k.startsWith('rider')) groups.rider.push(m);
    objects.push(m);
  }
  let shown = null;
  const animate = () => {
    const tide = globalThis.__aqTide === 'down' ? 'down' : 'up', key = tide + (globalThis.__aqRider ? '+r' : '');
    if (key === shown) return;
    shown = key;
    for (const m of groups.up) m.visible = tide === 'up';
    for (const m of groups.down) m.visible = tide === 'down';
    for (const m of groups.rider) m.visible = !!globalThis.__aqRider;
  };
  animate();
  return { static: [], plain: [], terrain: [], instances: [], objects, animate };
}
