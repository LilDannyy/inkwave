// Bluestone Junction — where do the bots ink? (fix round 1, review issue 1: the stage's size)
//   ERA=1|2|3 MAP=bluestone MODE=turf PAGE=…/ink-regions.js tools/botlab/run.sh tools/botlab/page.cjs
// An all-bot Turf War, 180 s stepped at 60 Hz in sim time (as match.cjs); then every live turf cell of the paint grid by
// region (Bravo's half folded onto Alpha's): its floor area and the share inked by either team. A region the bots leave
// bare is floor the stage pays for without play.
(async () => {
  const g = window.__inkwave, m = g.match, P = __G.paint, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  g.debug.freeze();
  const DT = 1 / 60; let t = 0;
  while (m.state === 'playing' && t < 180) { for (let k = 0; k < 15; k++) { g._skipRender = true; try { g._frame(DT); } catch (e) { /* */ } } g._skipRender = false; t += 0.25; }
  const S65 = Math.sin(65 * Math.PI / 180), C65 = Math.cos(65 * Math.PI / 180);
  const LY = await import('./src/world/stages/bluestone/layout.js'), G = await import('./src/world/stages/bluestone/ground.js');
  const region = (x, y, z) => {
    if (z > 0) { x = -x; z = -z; }   // fold Bravo's half onto Alpha's
    const al = x * S65 + z * C65, off = -x * C65 + z * S65, r = Math.hypot(x, z);
    if (G.inPoly(LY.ALLEY.quad, x, z)) return 'alley';
    if (y > 2.5 && y < 3.2 && x < -24 && z < -28 && !G.inPoly(LY.OUTLINE, x, z)) return 'garden';
    if (y > 4.5 && r < 16) return 'halo';
    if (!G.inPoly(LY.OUTLINE, x, z) && (x > 20 || z > -8)) return 'river-works';
    if (r <= 20) return 'circus';
    if (Math.abs(off) <= 15 && al <= -20) return 'arm';
    if (z <= -50) return 'base';
    if (Math.abs(x) <= 7) return 'swimston';
    return x < 0 ? 'west' : 'east';
  };
  const A = {}, grid = new Map(), v = { x: 0, y: 0, z: 0 };
  for (const f of P.paintFaces) {
    if (!f.turf) continue;
    for (let j = 0; j < f.nv; j++) for (let i = 0; i < f.nu; i++) {
      const k = f.grid + j * f.nu + i; if (!P.live[k]) continue;
      const a = (i + 0.5) * f.cu, b = (j + 0.5) * f.cv;
      v.x = f.origin.x + f.u.x * a + f.v.x * b; v.y = f.origin.y + f.u.y * a + f.v.y * b; v.z = f.origin.z + f.u.z * a + f.v.z * b;
      const rg = region(v.x, v.y, v.z), area = f.cu * f.cv, inked = P.grid[k] ? 1 : 0;
      const o = A[rg] || (A[rg] = { m2: 0, inked: 0 }); o.m2 += area; o.inked += area * inked;
      const fx = v.z > 0 ? -v.x : v.x, fz = v.z > 0 ? -v.z : v.z, key = Math.floor(fx / 4) + ':' + Math.floor(fz / 4);
      const c = grid.get(key) || { m2: 0, inked: 0 }; c.m2 += area; c.inked += area * inked; grid.set(key, c);
    }
  }
  const tot = Object.values(A).reduce((s, o) => ({ m2: s.m2 + o.m2, inked: s.inked + o.inked }), { m2: 0, inked: 0 });
  const rows = Object.fromEntries(Object.entries(A).sort((a, b) => b[1].m2 - a[1].m2).map(([k, o]) => [k, { m2: Math.round(o.m2), share: +(o.m2 / tot.m2).toFixed(3), inked: +(o.inked / o.m2).toFixed(2) }]));
  const cov = P.coverage ? P.coverage() : null;
  R('ink by region (both halves folded onto Alpha’s)', true, { era: new URLSearchParams(location.search).get('era'), simS: t, total_m2: Math.round(tot.m2), inked: +(tot.inked / tot.m2).toFixed(3), regions: rows });
  // a coarse map of Alpha's folded half: 4 m cells, 0–9 = inked tenths, . = no turf
  const lines = [];
  for (let zz = 0; zz >= -88; zz -= 4) { let s = ''; for (let xx = -64; xx < 32; xx += 4) { const c = grid.get(Math.floor(xx / 4) + ':' + Math.floor(zz / 4)); s += !c || c.m2 < 2 ? '.' : String(Math.min(9, Math.floor((c.inked / c.m2) * 10))); } lines.push(String(zz).padStart(4) + ' ' + s); }
  R('map (x −64 … 32 left to right, z 0 … −88 top to bottom; 0–9 inked tenths)', true, lines);
  return out;
})();
