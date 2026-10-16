// Bluestone round B fix 1 (scratch): the bots' own paths (the real Level / Physics / NavGraph, the embankment's colliders
// included) over the round-B pieces, per era:   ERA=1|2|3 node --import ./three-hook.mjs rb1-nav.mjs
//   • does the path between Hoki Lane and the arm (both ways), Prow Place and the tip, cross the Signal Garden's lawn
//     (nodes ≥ 1.1 m inside the yard)? its length, and the share of it on the lawn / ramps
//   • the tip: pad → the terminus platform, and the platform's two flights each reachable
//   • DESIGN §2.8's jump-2 measures on the current layout: Hoki Lane (−22, −44) → the tip's south lane at along −46;
//     Hoki Lane → Prow Place; the alley's east end → the arm at along −35
const root = new URL('../../../../../', import.meta.url).pathname;
const { MAP_LAYOUTS } = await import(root + 'src/world/maps.js');
const { layoutFor } = await import(root + 'src/world/variants.js');
const { Level } = await import(root + 'src/world/level.js');
const { Physics } = await import(root + 'src/game/physics.js');
const { NavGraph } = await import(root + 'src/game/nav.js');
const PR = await import(root + 'src/world/stages/bluestone/props.js');
const LY = await import(root + 'src/world/stages/bluestone/layout.js');
const G = await import(root + 'src/world/stages/bluestone/ground.js');
const L0 = layoutFor(MAP_LAYOUTS.bluestone, process.env.MODE || 'turf');
const extra = [];
for (const it of PR.PLACEMENTS) {
  if (it.type !== 'bluestone_berm') continue;
  for (const sgn of [1, -1]) { const [x, , z] = it.pos, [w, d] = it.size, rot = (it.rotY || 0) + (sgn < 0 ? Math.PI : 0), top = it.top ?? 3.0;
    extra.push({ obox: true, center: [sgn * x, (top - 2) / 2, sgn * z], size: [w, top + 2, d], rotY: (rot * 180) / Math.PI, roof: true }); }
}
const lvl = new Level(L0, extra), phys = new Physics(lvl), nav = new NavGraph(lvl, phys);
const near = (x, y, z) => nav.nearest({ x, y: y + 0.5, z }, 0.8, false);
const S65 = Math.sin(65 * Math.PI / 180), C65 = Math.cos(65 * Math.PI / 180), AO = (al, o) => [al * S65 - o * C65, al * C65 + o * S65];
const at = (al, o, y = 0) => { const [x, z] = AO(al, o); return [x, y, z]; };
const onLawn = (n) => n.y > 0.3 && G.inPoly(LY.YARD, n.x, n.z);
function route(from, to) {
  const a = near(...from), b = near(...to);
  if (a < 0 || b < 0) return 'no node';
  const p = nav.path(a, b, 0, 400000); if (!p) return 'UNREACHABLE';
  let s = 0, lawn = 0;
  for (let i = 1; i < p.length; i++) { const u = nav.nodes[p[i - 1]], v = nav.nodes[p[i]], d = Math.hypot(v.x - u.x, v.y - u.y, v.z - u.z); s += d; if (onLawn(u) || onLawn(v)) lawn += d; }
  return { m: +s.toFixed(1), onGarden_m: +lawn.toFixed(1), maxY: +Math.max(...p.map((k) => nav.nodes[k].y)).toFixed(2) };
}
const T = LY.TERMINUS;
const P = {
  hoki: [-21.5, 0, -31.5], arm: at(-35, -2), armTip: at(-40, -2), prow: [-21.5, 0, -21], tipLane: at(-48, -7), turning: at(-54.5, -4),
  platform: at(-52, 6.5, T.y), eastFlightFoot: at(-44.2, 6.5), southFlightFoot: at(-54.35, -0.8), hokiS: [-22, 0, -44], alleyE: LY.AL(18, 0).flatMap((v, i) => (i ? [v] : [v, 0])),
};
const pad = lvl.spawnPads[0], pa = nav.nearest({ x: pad.x, y: pad.y + 0.5, z: pad.z }, 0.8, true);
const fromPad = (q) => { const b = near(...q); if (b < 0) return 'no node'; const p = nav.path(pa, b, 0, 400000); if (!p) return 'UNREACHABLE'; let s = 0; for (let i = 1; i < p.length; i++) { const u = nav.nodes[p[i - 1]], v = nav.nodes[p[i]]; s += Math.hypot(v.x - u.x, v.y - u.y, v.z - u.z); } return +s.toFixed(1); };
const out = { era: process.env.ERA || '1', nodes: nav.nodes.length };
out['Hoki Lane -> arm'] = route(P.hoki, P.arm);
out['arm -> Hoki Lane'] = route(P.arm, P.hoki);
out['Hoki Lane -> arm at along -40'] = route(P.hoki, P.armTip);
out['arm at along -40 -> Hoki Lane'] = route(P.armTip, P.hoki);
out['Prow Place -> tip south lane'] = route(P.prow, P.tipLane);
out['tip south lane -> Prow Place'] = route(P.tipLane, P.prow);
out['Hoki Lane -> tip turning area'] = route(P.hoki, P.turning);
out['Hoki Lane S (-22,-44) -> tip south lane'] = route(P.hokiS, P.tipLane);
out['alley east end -> arm'] = route(P.alleyE, P.arm);
out['pad -> terminus platform'] = fromPad(P.platform);
out['east flight foot -> platform'] = route(P.eastFlightFoot, P.platform);
out['south flight foot -> platform'] = route(P.southFlightFoot, P.platform);
out['platform -> tip turning area'] = route(P.platform, P.turning);
console.log(JSON.stringify(out));
