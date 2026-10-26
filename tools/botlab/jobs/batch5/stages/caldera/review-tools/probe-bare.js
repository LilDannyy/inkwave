// reviewer probe 2 (caldera art review 1): (a) the lava hold works (y at low / high); (b) every visible static block of
// Alpha's half (z <= 0.3) that stands as a box at eye level (0.4–4 m tall, not a floor), whether any dressing vertex lies
// within 10 cm of its side faces (dressed) and its pattern: the undressed ones, by tag; (c) the hero card's day / dusk
(async () => {
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const g = window.__inkwave, G = window.__G, L = G.level, m = g.match;
  const step = (n) => { for (let i = 0; i < n; i++) g.debug.step(1000 / 60); };
  const lv = m.lava;
  const ys = {};
  for (const ph of ['low', 'high', 'low']) { lv.hold(ph); step(20); ys[ph] = +lv.y.toFixed(2); }
  R('lava.hold moves the level (low / high)', ys.low < 0 && ys.high > 0.5, ys);
  const { PropKit } = await import('./src/world/props.js');
  const { dressingFor } = await import('./src/world/dressing.js');
  const { PATTERN } = await import('./src/world/mapkit.js');
  const PN = {}; for (const [k, v] of Object.entries(PATTERN)) PN[v] = k; PN[70] = 'caldera:tuff'; PN[71] = 'caldera:basalt'; PN[72] = 'caldera:glaze';
  const kit = new PropKit(null, { headless: true });
  for (const it of dressingFor('caldera')) if ((!it.onlyIn || it.onlyIn === 'turf') && it.notIn !== 'turf') kit.add(it.type, it);
  // vertex cloud into a 0.5 m hash
  const H = new Map(), key = (x, y, z) => `${Math.floor(x * 2)},${Math.floor(y * 2)},${Math.floor(z * 2)}`;
  const V = G.camera.position.constructor, v = new V(); let nv = 0;
  for (const parts of kit._buckets.values()) for (const p of parts) { const P = p.g.attributes.position; for (let i = 0; i < P.count; i += 2) { v.fromBufferAttribute(P, i).applyMatrix4(p.m); const k = key(v.x, v.y, v.z); let a = H.get(k); if (!a) H.set(k, (a = [])); a.push(v.x, v.y, v.z); nv++; } }
  const near = (b) => { // count dressing vertices within 0.10 m of b's OBB and outside or on its side faces (not on its top)
    let n = 0; const x0 = Math.floor((b.aabbMin.x - 0.1) * 2), x1 = Math.floor((b.aabbMax.x + 0.1) * 2), y0 = Math.floor((b.aabbMin.y) * 2), y1 = Math.floor((b.aabbMax.y) * 2), z0 = Math.floor((b.aabbMin.z - 0.1) * 2), z1 = Math.floor((b.aabbMax.z + 0.1) * 2);
    for (let X = x0; X <= x1; X++) for (let Y = y0; Y <= y1; Y++) for (let Z = z0; Z <= z1; Z++) { const a = H.get(`${X},${Y},${Z}`); if (!a) continue;
      for (let i = 0; i < a.length; i += 3) { const dx = a[i] - b.center.x, dy = a[i + 1] - b.center.y, dz = a[i + 2] - b.center.z; let s = 0, inY = false;
        for (let k = 0; k < 3; k++) { const ax = b.axes[k], h = k === 0 ? b.half.x : k === 1 ? b.half.y : b.half.z; const u = dx * ax.x + dy * ax.y + dz * ax.z; const e = Math.max(0, Math.abs(u) - h); s += e * e; if (k === 1) inY = Math.abs(u) < h - 0.02; }
        if (Math.sqrt(s) <= 0.10 && inY) n++; } }
    return n; };
  const blocks = L.blocks.filter((b) => b.solid && !b.hidden && b.lavaRider == null && b.center.z <= 0.3);
  const rows = {}; let nB = 0, nBare = 0;
  for (const b of blocks) {
    const h = b.aabbMax.y - b.aabbMin.y, wx = b.aabbMax.x - b.aabbMin.x, wz = b.aabbMax.z - b.aabbMin.z;
    if (h < 0.4 || h > 4.5 || Math.min(wx, wz) > 6) continue;   // (boxes at eye level, not floors / big walls)
    nB++; const d = near(b); const t = b.tag || '(untagged)';
    const r = rows[t] || (rows[t] = { n: 0, bare: 0, pats: {}, ex: null });
    r.n++; if (d < 12) { r.bare++; nBare++; r.ex = r.ex || [+b.center.x.toFixed(1), +b.center.y.toFixed(1), +b.center.z.toFixed(1), +h.toFixed(1)]; }
    const pn = PN[b.pattern] || b.pattern; r.pats[pn] = (r.pats[pn] || 0) + 1;
  }
  R('dressing vertices', true, { nv });
  R(`eye-level boxes in Alpha's half: ${nB}, with no dressing within 10 cm of a side face: ${nBare}`, nBare === 0, {});
  for (const [t, r] of Object.entries(rows).sort((a, b) => b[1].bare - a[1].bare)) if (r.bare) R(`bare: ${t}`, false, r);
  // riders (Organ Pipes, stones): what dresses them (dressing vertices near their parts at LOW)
  const rid = L.blocks.filter((b) => b.lavaRider != null && b.center.y > -10);
  let rn = 0; for (const b of rid) rn += near(b);
  R('rider parts at LOW (Organ Pipes) with dressing vertices within 10 cm (static dressing cannot follow a rider)', true, { parts: rid.length, verts: rn, tags: [...new Set(rid.map((b) => b.tag.split(':').slice(0, 2).join(':')))] });
  return out;
})()
