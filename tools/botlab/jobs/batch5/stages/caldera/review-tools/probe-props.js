// reviewer probe (caldera art review 1): every static dressing vertex (the stage's PLACEMENTS, headless, both halves, as
// built in this MODE) against the built level: ghost geometry in the player's space (> 8.5 cm from every solid block and
// 0.02–2.0 m over the walkable top below it), on a walkable top, inside a rider's column, in the lava region not hugging
// a block; plus the decor lamps. Grouped by placement type.
(async () => {
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const g = window.__inkwave, G = window.__G, L = G.level, m = g.match;
  const MODE = (m && m.mode) || 'turf';
  const { PropKit } = await import('./src/world/props.js');
  const { dressingFor } = await import('./src/world/dressing.js');
  const V = G.camera.position.constructor;
  const blocks = L.blocks.filter((b) => b.solid && b.lavaRider == null);
  const riders = L.blocks.filter((b) => b.lavaRider != null);
  const obbD = (b, p) => { // 3D distance from p to block b's OBB, and local coords
    const dx = p.x - b.center.x, dy = p.y - b.center.y, dz = p.z - b.center.z; let s = 0; const loc = [];
    for (let k = 0; k < 3; k++) { const a = b.axes[k], h = k === 0 ? b.half.x : k === 1 ? b.half.y : b.half.z; const u = dx * a.x + dy * a.y + dz * a.z; loc.push([u, h]); const e = Math.max(0, Math.abs(u) - h); s += e * e; }
    return [Math.sqrt(s), loc];
  };
  // the walkable top under (x, z) at or below y + 0.05: axis-aligned-up blocks only (axes[1] = up), not roof
  const topUnder = (x, y, z) => { let best = null;
    for (const b of blocks) { if (b.roof || b.rail || b.grate) continue; if (x < b.aabbMin.x || x > b.aabbMax.x || z < b.aabbMin.z || z > b.aabbMax.z) continue;
      const up = b.axes[1]; if (up.y < 0.99) continue; const t = b.center.y + b.half.y; if (t > y + 0.05) continue;
      const dx = x - b.center.x, dz = z - b.center.z; const u = dx * b.axes[0].x + dz * b.axes[0].z, w = dx * b.axes[2].x + dz * b.axes[2].z;
      if (Math.abs(u) > b.half.x - 0.05 || Math.abs(w) > b.half.z - 0.05) continue; if (!best || t > best.t) best = { t, tag: b.tag }; }
    return best; };
  const inRider = (p) => { for (const b of riders) { const dx = p.x - b.center.x, dz = p.z - b.center.z; const u = dx * b.axes[0].x + dz * b.axes[0].z, w = dx * b.axes[2].x + dz * b.axes[2].z;
      if (Math.abs(u) < b.half.x + 0.02 && Math.abs(w) < b.half.z + 0.02 && p.y > -1.2 && p.y < b.center.y + b.half.y + 2.5) return b.tag; } return null; };
  const inReg = (x, z) => !!(m.lava && m.lava.W && m.lava.W.inRegion(x, z));
  const B = L.layout.bounds || null;
  const items = dressingFor('caldera').filter((it) => (!it.onlyIn || it.onlyIn === MODE) && it.notIn !== MODE);
  const per = {}; let nV = 0;
  const tot = { ghost: 0, onTop: 0, rider: 0, lava: 0 };
  for (const it of items) {
    const kit = new PropKit(null, { headless: true }); kit.add(it.type, it);
    const key = it.type; const s = per[key] || (per[key] = { n: 0, ghost: 0, ghostAt: null, ghostMax: 0, onTop: 0, onTopAt: null, rider: 0, riderAt: null, lava: 0, lavaAt: null });
    const v = new V();
    for (const parts of kit._buckets.values()) for (const p of parts) { const P = p.g.attributes.position; const step = P.count > 4000 ? 3 : 1;
      for (let i = 0; i < P.count; i += step) { v.fromBufferAttribute(P, i).applyMatrix4(p.m); s.n++; nV++;
        let dmin = 9, hug = false;
        for (const b of blocks) { if (v.x < b.aabbMin.x - 0.2 || v.x > b.aabbMax.x + 0.2 || v.z < b.aabbMin.z - 0.2 || v.z > b.aabbMax.z + 0.2 || v.y < b.aabbMin.y - 0.2 || v.y > b.aabbMax.y + 0.2) continue;
          const [d] = obbD(b, v); if (d < dmin) dmin = d; }
        const fl = topUnder(v.x, v.y, v.z);
        const at = [+v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(2)];
        if (fl && v.y - fl.t > 0.02 && v.y - fl.t < 2.0 && dmin > 0.085) { s.ghost++; tot.ghost++; if (dmin > s.ghostMax) { s.ghostMax = dmin; s.ghostAt = [...at, fl.tag, +(v.y - fl.t).toFixed(2), +dmin.toFixed(2)]; } }
        const rt = inRider(v); if (rt) { s.rider++; tot.rider++; s.riderAt = [...at, rt]; }
        if (inReg(v.x, v.z) && v.y < 1.1 && v.y > -0.7 && dmin > 0.085 && !fl) { s.lava++; tot.lava++; s.lavaAt = [...at, +dmin.toFixed(2)]; }
      } }
  }
  const rows = Object.entries(per).filter(([, s]) => s.ghost || s.rider || s.lava).map(([k, s]) => ({ type: k, verts: s.n, ghost: s.ghost, ghostMax: +s.ghostMax.toFixed(2), ghostAt: s.ghostAt, rider: s.rider, riderAt: s.riderAt, lava: s.lava, lavaAt: s.lavaAt }));
  R('MODE ' + MODE + ': placements ' + items.length + ', vertices ' + nV, true, {});
  for (const r of rows) R('type ' + r.type, false, r);
  R('totals', tot.ghost === 0 && tot.rider === 0 && tot.lava === 0, tot);
  // the decor lamps: their foot (groundHeight) and what is under them
  const lamps = L.layout.decor.lamps, pts = [...lamps, ...lamps.map(([x, z]) => [-x, -z])];
  const lr = pts.map(([x, z]) => { const y = Math.max(0, L.groundHeight(x, z)); const fl = topUnder(x, y + 0.01, z); return [x, z, +y.toFixed(2), fl ? fl.tag : null, inReg(x, z)]; });
  R('decor lamps (x, z, foot y, walkable top under, in lava region)', true, lr);
  return out;
})()
