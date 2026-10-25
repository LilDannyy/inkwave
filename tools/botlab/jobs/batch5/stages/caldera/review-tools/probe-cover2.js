// reviewer probe (caldera art review 2): which paintable level faces (Alpha's half) the dressing covers. Every paintable
// face sampled every 0.3 m; a sample 8 mm out along the face normal inside a dressing part's box = covered (ink there is
// hidden under an opaque prop); else a sample 8 mm in that is inside a part = the part's face is coplanar with the level
// face (z-fighting with the ink). Parts are tested as their local bounding boxes (exact for the box parts). By block tag.
(async () => {
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const g = window.__inkwave, G = window.__G, L = G.level;
  const THREE = await import('three');
  const { PropKit } = await import('./src/world/props.js');
  const { dressingFor } = await import('./src/world/dressing.js');
  const parts = [];
  for (const it of dressingFor('caldera')) { if ((it.onlyIn && it.onlyIn !== 'turf') || it.notIn === 'turf') continue;
    const k = new PropKit(null, { headless: true }); k.add(it.type, it);
    for (const ps of k._buckets.values()) for (const p of ps) { p.g.computeBoundingBox(); const inv = p.m.clone().invert(); const bb = p.g.boundingBox.clone();
      const wb = bb.clone().applyMatrix4(p.m); parts.push({ type: it.type, inv, bb, wb }); } }
  const v = new THREE.Vector3(), w = new THREE.Vector3();
  const inside = (pt) => { for (const q of parts) { if (!q.wb.containsPoint(pt)) continue; w.copy(pt).applyMatrix4(q.inv); if (q.bb.containsPoint(w)) return q.type; } return null; };
  const solids = L.blocks.filter((b) => b.solid);
  const deadAt = (p, f) => { const q = p.clone().addScaledVector(f.n, 0.05); for (const b of solids) { if (b.id === f.block) continue; if (q.x < b.aabbMin.x || q.x > b.aabbMax.x || q.y < b.aabbMin.y || q.y > b.aabbMax.y || q.z < b.aabbMin.z || q.z > b.aabbMax.z) continue;
      const d = q.clone().sub(b.center); if (Math.abs(d.dot(b.axes[0])) <= b.half.x && Math.abs(d.dot(b.axes[1])) <= b.half.y && Math.abs(d.dot(b.axes[2])) <= b.half.z) return true; } return false; };
  const S = 0.3; const byTag = {}; const tot = { floorA: 0, floorCov: 0, floorFight: 0, wallA: 0, wallCov: 0, wallFight: 0 };
  for (const f of L.faces) {
    if (!f.paintable) continue; const b = L.blocks[f.block]; if (b.lavaRider != null) continue;
    const c = f.origin.clone().addScaledVector(f.u, f.su / 2).addScaledVector(f.v, f.sv / 2); if (c.z > 0.3) continue;
    const nu = Math.max(1, Math.round(f.su / S)), nv = Math.max(1, Math.round(f.sv / S)); const a = (f.su * f.sv) / (nu * nv);
    const floor = f.n.y > 0.7; const t = b.tag || '(untagged)'; const r = byTag[t] || (byTag[t] = { floorA: 0, floorCov: 0, floorFight: 0, wallA: 0, wallCov: 0, wallFight: 0, by: {} });
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      v.copy(f.origin).addScaledVector(f.u, (i + 0.5) * f.su / nu).addScaledVector(f.v, (j + 0.5) * f.sv / nv);
      const po = v.clone().addScaledVector(f.n, 0.008), pi = v.clone().addScaledVector(f.n, -0.008);
      const k = floor ? 'floor' : 'wall'; r[k + 'A'] += a; tot[k + 'A'] += a;
      const o = inside(po); if (o && deadAt(v, f)) { r.dead = (r.dead || 0) + a; tot.dead = (tot.dead || 0) + a; continue; } if (o) { r[k + 'Cov'] += a; tot[k + 'Cov'] += a; r.by[o] = (r.by[o] || 0) + a; continue; }
      const ii = inside(pi); if (ii) { r[k + 'Fight'] += a; tot[k + 'Fight'] += a; r.by[ii + '(coplanar)'] = (r.by[ii + '(coplanar)'] || 0) + a; }
    }
  }
  const rd = (x) => +x.toFixed(1);
  R('paintable area in Alpha\'s half (m²): floors / walls; covered by dressing (ink hidden) / coplanar (z-fight)', tot.floorCov + tot.floorFight + tot.wallCov + tot.wallFight < 1, Object.fromEntries(Object.entries(tot).map(([k, x]) => [k, rd(x)])));
  for (const [t, r] of Object.entries(byTag).sort((a, b) => (b[1].floorCov + b[1].floorFight + b[1].wallCov + b[1].wallFight) - (a[1].floorCov + a[1].floorFight + a[1].wallCov + a[1].wallFight))) {
    const s = r.floorCov + r.floorFight + r.wallCov + r.wallFight; if (s < 0.5) continue;
    R('tag ' + t, false, { dead: rd(r.dead || 0), floorA: rd(r.floorA), floorCov: rd(r.floorCov), floorFight: rd(r.floorFight), wallA: rd(r.wallA), wallCov: rd(r.wallCov), wallFight: rd(r.wallFight), by: Object.fromEntries(Object.entries(r.by).map(([k, x]) => [k, rd(x)])) });
  }
  return out;
})()
