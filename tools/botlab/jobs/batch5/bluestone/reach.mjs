// Bluestone fix round 3 (scratch): reachability on the bots' nav (the real Level / Physics / NavGraph, the embankment's
// colliders included) from Alpha's pad to the round-3 pieces, per era:   ERA=1|2|3 node --import ./three-hook.mjs reach.mjs
const root = new URL('../../../../../', import.meta.url).pathname;
const { MAP_LAYOUTS } = await import(root + 'src/world/maps.js');
const { layoutFor } = await import(root + 'src/world/variants.js');
const { Level } = await import(root + 'src/world/level.js');
const { Physics } = await import(root + 'src/game/physics.js');
const { NavGraph } = await import(root + 'src/game/nav.js');
const PR = await import(root + 'src/world/stages/bluestone/props.js');
const LY = await import(root + 'src/world/stages/bluestone/layout.js');
const L0 = layoutFor(MAP_LAYOUTS.bluestone, process.env.MODE || 'turf');
const extra = [];
for (const it of PR.PLACEMENTS) {
  if (it.type !== 'bluestone_berm') continue;
  for (const sgn of [1, -1]) { const [x, , z] = it.pos, [w, d] = it.size, rot = (it.rotY || 0) + (sgn < 0 ? Math.PI : 0), top = it.top ?? 3.0;
    extra.push({ obox: true, center: [sgn * x, (top - 2) / 2, sgn * z], size: [w, top + 2, d], rotY: (rot * 180) / Math.PI, roof: true }); }
}
const lvl = new Level(L0, extra), phys = new Physics(lvl), nav = new NavGraph(lvl, phys);
const near = (x, y, z) => nav.nearest({ x, y: y + 0.5, z }, 0.8, false);
const plen = (p) => { let s = 0; for (let i = 1; i < p.length; i++) { const u = nav.nodes[p[i - 1]], v = nav.nodes[p[i]]; s += Math.hypot(v.x - u.x, v.y - u.y, v.z - u.z); } return +s.toFixed(1); };
const pad = lvl.spawnPads[0], a = nav.nearest({ x: pad.x, y: pad.y + 0.5, z: pad.z }, 0.8, true);
const S65 = Math.sin(65 * Math.PI / 180), C65 = Math.cos(65 * Math.PI / 180), AO = (al, o) => [al * S65 - o * C65, al * C65 + o * S65];
const T = LY.TERMINUS, HS = LY.HOTEL_STAIR;
const spots = {
  'halo 225 side': [-9.5, 5.3, -9.5], 'halo 270 side': [-12.9, 5.4, 0], 'hotel stair top landing': [-15.2, 5.2, -6.5],
  'hotel stair mid': [-15.2, 3.8, -11.7], 'garden lawn N': [-28.5, 1.2, -21], 'garden walk E': [-25.5, 1.2, -33.0],
  'garden walk W (by the tip)': LY.AL(8, 4).flatMap((v, i) => (i ? [v] : [v, 1.2])), 'garden lawn by the mouth': [-27.5, 1.2, -19.5],
  'terminus platform': [...AO(-52, 6.5)].flatMap((v, i) => (i ? [v] : [v, T.y])), 'tip street': [...AO(-54, -5)].flatMap((v, i) => (i ? [v] : [v, 0])),
  'alley middle': LY.AL(12, 0).flatMap((v, i) => (i ? [v] : [v, 0])),
};
const out = { era: process.env.ERA || '1' };
for (const [k, [x, y, z]] of Object.entries(spots)) {
  const b = near(x, y, z); if (b < 0) { out[k] = 'no node'; continue; }
  const n = nav.nodes[b], p = nav.path(a, b, 0, 400000);
  out[k] = p ? { at: [+n.x.toFixed(1), +n.y.toFixed(2), +n.z.toFixed(1)], fromPad: plen(p) } : { at: [+n.x.toFixed(1), +n.y.toFixed(2), +n.z.toFixed(1)], fromPad: 'UNREACHABLE' };
}
// the hotel stair: from the balcony landing to the Halo, and Prow Place → garden → tip (the walk) on the nav
const via = (from, to) => { const p = nav.path(near(...from), near(...to), 0, 400000); return p ? plen(p) : 'UNREACHABLE'; };
out.landingToHalo = via([-12.5, 2.4, -14], [-12.9, 5.4, -2]);
out.ringToHalo_viaHotelStair = via([-14, 0, -9], [-12.9, 5.4, -2]);
out.prowToGardenWalk = via([-21.5, 0, -22], [-28.5, 1.2, -33.0]);
out.armToGarden = via([...AO(-34, 0)].flatMap((v, i) => (i ? [v] : [v, 0])), [-30.5, 1.2, -25.5]);
out.alleyToGarden = via(LY.AL(14, 0).flatMap((v, i) => (i ? [v] : [v, 0])), [-30.5, 1.2, -25.5]);
out.prowToTip_street = via([-21.5, 0, -22], [...AO(-54, -3)].flatMap((v, i) => (i ? [v] : [v, 0])));
console.log(JSON.stringify(out));
