// Gulper Aquarium — the stage's own looks outside the level geometry (layout.env.backdrop; see the top of
// src/world/environment.js). Gets the environment's SCENERY_KIT (+ THREE, bounds, runs, rnd, sceneryMaterial) — it
// imports nothing that imports three, so layout.js stays importable in Node.
//
// BLOCKOUT: no far scenery yet (the art pass). What this draws now is the stage's glass and water as placeholder
// volumes — the level blocks for them are hidden colliders (layout.js `glass`) — and the Tubeway as placeholder clear
// tubes along the legs' real centrelines (tubeway.js) with their mouths: a white ring at a two-way end, green at an
// IN end, red at an OUT end, chevrons along the one-way legs pointing with the flow, a pale disc on each landing point.
// The Kelp Lines' tide (UP / DOWN) swaps their rings and chevrons: globalThis.__aqTide = 'down' shows the DOWN state
// (the pipe engine will own this; the blockout's pictures set it by hand).
import { PIPES, allLegs, centreline, endsOf } from './tubeway.js';

export function buildBackdrop(kit, data = {}) {
  const T = kit.THREE, DEG = Math.PI / 180;
  const buckets = { glass: [], water: [], kelp: [], tube: [], two: [], in: [], out: [], land: [], upIn: [], upOut: [], dnIn: [], dnOut: [], chev: [], upChev: [], dnChev: [] };
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
      const disc = new T.CircleGeometry(1.0, 20); disc.rotateX(-Math.PI / 2); disc.translate(e.land[0], e.land[1] + 0.04, e.land[2]);
      if (two || tidal || e.k === 1) put('land', disc);
    }
    if (!two) {   // chevrons every 3 m along the leg (not in its first / last 3 m), pointing with the flow
      const L = path.getLength();
      for (let s = 3; s < L - 3; s += 3) {
        const p = path.getPointAt(s / L), t = path.getTangentAt(s / L);
        for (const [key, dir] of tidal ? [['upChev', 1], ['dnChev', -1]] : [['chev', 1]]) {
          const c = new T.ConeGeometry(0.3, 0.65, 10); c.applyQuaternion(new T.Quaternion().setFromUnitVectors(UP, t.clone().multiplyScalar(dir))); c.translate(p.x, p.y, p.z);
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
    water: see('#2b5966', 0.42, { roughness: 0.1 }), glass: see('#d9eef0', 0.16, { roughness: 0.05 }), kelp: std('#5b5a33', { roughness: 0.8 }),
    tube: see('#eef8f8', 0.3, { roughness: 0.05 }), two: glow('#f4f1e8'), in: glow('#3cc46a'), out: glow('#c8402f'), land: new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.32, depthWrite: false }),
    chev: glow('#3cc46a'), upIn: glow('#3cc46a'), upOut: glow('#c8402f'), dnIn: glow('#3cc46a'), dnOut: glow('#c8402f'), upChev: glow('#3cc46a'), dnChev: glow('#3cc46a'),
  };
  const objects = [], groups = { up: [], down: [] };
  for (const [k, geos] of Object.entries(buckets)) {
    const g = merge(geos); if (!g) continue;
    const m = new T.Mesh(g, LOOK[k]); m.name = 'aq-' + k; m.renderOrder = k === 'water' ? 1 : k === 'glass' || k === 'tube' ? 2 : 0;
    if (k.startsWith('up')) groups.up.push(m); else if (k.startsWith('dn')) groups.down.push(m);
    objects.push(m);
  }
  let shown = null;
  const animate = () => {
    const tide = globalThis.__aqTide === 'down' ? 'down' : 'up';
    if (tide === shown) return;
    shown = tide;
    for (const m of groups.up) m.visible = tide === 'up';
    for (const m of groups.down) m.visible = tide === 'down';
  };
  animate();
  return { static: [], plain: [], terrain: [], instances: [], objects, animate };
}
