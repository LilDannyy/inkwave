// [b5-int3] (scratch) prints level blocks by index (bounds, flags, tag) — PAGE_ARGS='ids=233,235,…'
(async () => {
  const G = window.__G, L = G.level, out = [];
  const ids = ((/ids=([\d,]+)/.exec(window.__pageArgs || '') || [])[1] || '').split(',').filter(Boolean).map(Number);
  const r2 = (x) => Math.round(x * 100) / 100;
  for (const id of ids) {
    const b = L.blocks[id]; if (!b) { out.push({ name: 'block ' + id + ': none', ok: false }); continue; }
    const c = b.center || b.pos, h = b.half;
    out.push({ name: `block ${id}`, ok: true, info: { tag: b.tag || null, center: c ? [r2(c.x), r2(c.y), r2(c.z)] : null, half: h ? [r2(h.x), r2(h.y), r2(h.z)] : null, min: b.min ? [r2(b.min.x), r2(b.min.y), r2(b.min.z)] : null, max: b.max ? [r2(b.max.x), r2(b.max.y), r2(b.max.z)] : null, rotY: b.rotY ?? null, hidden: !!b.hidden, roof: !!b.roof, rail: !!b.rail, perch: !!b.perch, paint: !!b.paint, keys: Object.keys(b).slice(0, 30) } });
  }
  return out;
})();
