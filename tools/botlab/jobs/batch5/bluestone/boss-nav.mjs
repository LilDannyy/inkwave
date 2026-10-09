// Bluestone blockout (scratch): HULLBREAKER's nav on the blockout, in Node (the real BossNav over the real Level, the
// embankment's prop colliders included).   ERA=2 node --import ./three-hook.mjs boss-nav.mjs [root]
// Prints the home ground's area and box, the plannable area in the circus ring (r 8.8 … 20), and a map of mid
// (# wall · ~ drop · . floor · o plannable · @ home ground).
const root = process.argv[2] || new URL('../../../../../', import.meta.url).pathname;
const { MAP_LAYOUTS } = await import(root + '/src/world/maps.js');
const { layoutFor } = await import(root + '/src/world/variants.js');
const { Level } = await import(root + '/src/world/level.js');
const { BossNav } = await import(root + '/src/boss/bossNav.js');
const PR = await import(root + '/src/world/stages/bluestone/props.js');
const L = layoutFor(MAP_LAYOUTS.bluestone, 'boss');
const extra = [];
for (const it of PR.PLACEMENTS) {
  if (it.type !== 'bluestone_berm') continue;
  for (const sgn of [1, -1]) { const [x, , z] = it.pos, [w, d] = it.size, rot = (it.rotY || 0) + (sgn < 0 ? Math.PI : 0), top = it.top ?? 3.0;
    extra.push({ obox: true, center: [sgn * x, (top - 2) / 2, sgn * z], size: [w, top + 2, d], rotY: (rot * 180) / Math.PI, roof: true }); }
}
const lvl = new Level(L, extra);
const nav = new BossNav(lvl);
let bx0 = Infinity, bx1 = -Infinity, bz0 = Infinity, bz1 = -Infinity, ring = 0, ringOk = 0;
for (const i of nav.planIds) { const [x, z] = nav.xz(i); bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); bz0 = Math.min(bz0, z); bz1 = Math.max(bz1, z); const r = Math.hypot(x, z); if (r >= 8.8 && r <= 20) ring++; }
const N = nav.nx * nav.nz;
for (let i = 0; i < N; i++) { const [x, z] = nav.xz(i); const r = Math.hypot(x, z); if (r >= 8.8 && r <= 20 && nav.Dw[i] >= 2.9 && nav.Dv[i] >= 1.8) ringOk++; }
console.log(JSON.stringify({ home_m2: nav.area, box: [bx0, bx1, bz0, bz1].map((v) => +v.toFixed(1)), ringHome_m2: ring * 0.25, ringPlannable_m2: ringOk * 0.25 }));
if (process.env.MAPMID) for (let z = 24; z >= -24; z -= 1) { let row = ''; for (let x = -26; x <= 26; x += 0.5) { const i = nav.cell(x, z); const k = nav.kind[i]; row += nav.plan[i] ? '@' : nav.Dw[i] >= 2.9 && nav.Dv[i] >= 1.8 ? 'o' : k === 1 ? '#' : k === 2 ? '~' : k === 3 ? 'P' : '.'; } console.log(String(z).padStart(4), row); }
