// Bluestone blockout (scratch): dump the layout (both halves, mirrored) for one era + mode as JSON: {k, poly (xz corners), y0, y1, ramp ends, flags}.
//   ERA=1|2|3|all MODE=turf|tower node dump-layout.mjs > dump.json   (read by appear-check.py, strips.py, deadend.py)
const root = new URL('../../../../../', import.meta.url).pathname;
const m = await import('file://' + root + '/src/world/stages/bluestone/layout.js');
const mode = process.env.MODE || 'turf';
const L = m.LAYOUT;
const keep = (d) => {
  const inc = (v) => v === undefined ? null : (Array.isArray(v) ? v : [v]);
  const oi = inc(d.onlyIn), ni = inc(d.notIn);
  if (oi && !oi.includes(mode)) return false;
  if (ni && ni.includes(mode)) return false;
  return true;
};
const out = [];
function push(d, mir) {
  const f = (x, z) => mir ? [-x, -z] : [x, z];
  const flags = { roof: !!d.roof, rail: !!d.rail, hidden: !!d.hidden, paint: d.paint !== false, tag: d.tag || '', eras: d.eras || '', grp: d.eraGroup || '', solid: d.solid !== false };
  if (d.kind === 'box') {
    const [x0, y0, z0] = d.min, [x1, y1, z1] = d.max;
    out.push({ k: 'b', poly: [f(x0, z0), f(x1, z0), f(x1, z1), f(x0, z1)], y0, y1, ...flags });
  } else if (d.kind === 'obox') {
    const a = d.rotY * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    const ax = [c, -s], az = [s, c];
    const [cx, cy, cz] = d.center, hw = d.size[0] / 2, hh = d.size[1] / 2, hd = d.size[2] / 2;
    const P = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => f(cx + ax[0] * hw * i + az[0] * hd * j, cz + ax[1] * hw * i + az[1] * hd * j));
    out.push({ k: 'b', poly: P, y0: cy - hh, y1: cy + hh, ...flags });
  } else if (d.kind === 'ramp') {
    const [lx, ly, lz] = d.low, [hx, hy, hz] = d.high;
    const dx = hx - lx, dz = hz - lz, h = Math.hypot(dx, dz); const sx = -dz / h * d.width / 2, sz = dx / h * d.width / 2;
    const P = [f(lx + sx, lz + sz), f(hx + sx, hz + sz), f(hx - sx, hz - sz), f(lx - sx, lz - sz)];
    const lo = f(lx, lz), hi = f(hx, hz);
    out.push({ k: 'r', poly: P, lo, hi, ly, hy, y0: Math.min(ly, hy) - 0.6, y1: Math.max(ly, hy), ...flags });
  }
}
for (const d of L.single) if (keep(d)) push(d, false);
for (const d of L.half) if (keep(d)) { push(d, false); push(d, true); }
const extra = { zones: L.zones, tower: L.tower, pads: L.spawnPads, rail: m.RAILYARD };
console.log(JSON.stringify({ era: L.era, mode, pieces: out, extra }));
