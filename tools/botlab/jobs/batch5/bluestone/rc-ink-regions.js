// Bluestone Junction — where do the bots ink? (fix round 1, review issue 1: the stage's size; round C: the Z's regions)
//   ERA=1|2|3 MAP=bluestone MODE=turf PAGE=…/ink-regions.js tools/botlab/run.sh tools/botlab/page.cjs
// An all-bot Turf War, 180 s stepped at 60 Hz in sim time (as match.cjs); then every live turf cell of the paint grid by
// region (Bravo's half folded onto Alpha's): its floor area and the share inked by either team. A region the bots leave
// bare is floor the stage pays for without play.
(async () => {
  const g = window.__inkwave, m = g.match, P = __G.paint, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const LY = await import('./src/world/stages/bluestone/layout.js'), G = await import('./src/world/stages/bluestone/ground.js');
  const X2 = window.__pageArgs === 'x2';
  // (round C: the Z's regions, as rc-cover.mjs: Bravo's half folded onto Alpha's; the Halo counts its three stairs and
  //  their landings, the garden is the floating garden in the river corner's basin, 'river' the punt and the bridge)
  const inR = (r, x, z) => x > r[0] && x < r[1] && z > r[2] && z < r[3];
  const region = (x, y, z) => {
    if (z > 0) { x = -x; z = -z; }
    const r = Math.hypot(x, z), HS = LY.HOTEL_STAIR, BS = LY.BOAT_STAIR, RS = LY.RIVER_STAIR;
    if (y > 2.3 && ((x > HS.x0 - 0.2 && x < HS.x1 + 0.2 && z > HS.zFoot - 0.8 && z < HS.zLand + 0.2) || (x > BS.x0 - 0.2 && x < BS.x1 + 0.2 && z > BS.zFoot - 0.2 && z < BS.zLand + 0.2)
      || (x > RS.xLand - 0.2 && x < RS.xFoot + 0.2 && z > RS.z0 - 0.2 && z < -14.4))) return 'halo';
    if (y > 4.5 && r < 17) return 'halo';
    if (LY.GARDEN.some((g) => inR(g, x, z)) && y > -0.3) return 'garden';
    if (!G.inPoly(LY.OUTLINE, x, z)) return 'river';
    if ((Math.abs(x) <= 20 && z >= -20) || inR([14.4, 21.6, -24.1, -11.9], x, z)) return 'circus';
    if (x > 20) return 'knee-far';
    if (z <= -50) return 'base';
    if (z > -26) return 'knee';
    if (x < -31) return 'hoki';
    if (x < -26) return 'arcade';
    if (x < -13) return 'swimston';
    return 'gpo-quay';
  };
  // PAGE_ARGS=x2: the Halo's and the garden's paint value doubled for the bots' paint goals (regionStats' empty and enemy
  // shares ×2 there), DESIGN §3.9's ×2 fresh-ground weight held on for the whole match — an experiment, not shipped
  let x2calls = 0;
  if (X2) { const P0 = __G.paint, orig = P0.regionStats.bind(P0);
    P0.regionStats = function (x, y, z, r, team, out) { const o = orig(x, y, z, r, team, out); const rg = region(x, y, z); if ((rg === 'halo' || rg === 'garden') && o && o.n) { o.empty *= 2; o.enemy *= 2; x2calls++; } return o; }; }
  g.debug.freeze();
  const DT = 1 / 60; let t = 0;
  while (m.state === 'playing' && t < 180) { for (let k = 0; k < 15; k++) { g._skipRender = true; try { g._frame(DT); } catch (e) { /* */ } } g._skipRender = false; t += 0.25; }
  const A = {}, grid = new Map(), fine = new Map(), v = { x: 0, y: 0, z: 0 };
  for (const f of P.paintFaces) {
    if (!f.turf) continue;
    for (let j = 0; j < f.nv; j++) for (let i = 0; i < f.nu; i++) {
      const k = f.grid + j * f.nu + i; if (!P.live[k]) continue;
      const a = (i + 0.5) * f.cu, b = (j + 0.5) * f.cv;
      v.x = f.origin.x + f.u.x * a + f.v.x * b; v.y = f.origin.y + f.u.y * a + f.v.y * b; v.z = f.origin.z + f.u.z * a + f.v.z * b;
      const rg = region(v.x, v.y, v.z), area = f.cu * f.cv, inked = P.grid[k] ? 1 : 0;
      const o = A[rg] || (A[rg] = { m2: 0, inked: 0 }); o.m2 += area; o.inked += area * inked;
      const fx = v.z > 0 ? -v.x : v.x, fz = v.z > 0 ? -v.z : v.z, key = Math.floor(fx / 4) + ':' + Math.floor(fz / 4);
      if (rg === 'garden' || rg === 'halo') { const k2 = rg[0] + Math.floor(fx / 1.5) + ':' + Math.floor(fz / 1.5); const c2 = fine.get(k2) || { m2: 0, inked: 0 }; c2.m2 += area; c2.inked += area * inked; fine.set(k2, c2); }
      const c = grid.get(key) || { m2: 0, inked: 0 }; c.m2 += area; c.inked += area * inked; grid.set(key, c);
    }
  }
  const tot = Object.values(A).reduce((s, o) => ({ m2: s.m2 + o.m2, inked: s.inked + o.inked }), { m2: 0, inked: 0 });
  const rows = Object.fromEntries(Object.entries(A).sort((a, b) => b[1].m2 - a[1].m2).map(([k, o]) => [k, { m2: Math.round(o.m2), share: +(o.m2 / tot.m2).toFixed(3), inked: +(o.inked / o.m2).toFixed(2) }]));
  const cov = P.coverage ? P.coverage() : null;
  R('ink by region (both halves folded onto Alpha’s)', true, { era: new URLSearchParams(location.search).get('era'), x2: X2 ? x2calls : undefined, simS: t, total_m2: Math.round(tot.m2), inked: +(tot.inked / tot.m2).toFixed(3), regions: rows });
  // a coarse map of Alpha's folded half: 4 m cells, 0–9 = inked tenths, . = no turf
  const lines = [];
  for (let zz = 0; zz >= -80; zz -= 4) { let s = ''; for (let xx = -40; xx < 40; xx += 4) { const c = grid.get(Math.floor(xx / 4) + ':' + Math.floor(zz / 4)); s += !c || c.m2 < 2 ? '.' : String(Math.min(9, Math.floor((c.inked / c.m2) * 10))); } lines.push(String(zz).padStart(4) + ' ' + s); }
  R('map (x −40 … 40 left to right, z 0 … −80 top to bottom; 0–9 inked tenths)', true, lines);
  return out;
})();
