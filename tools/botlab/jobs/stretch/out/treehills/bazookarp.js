// Eco-Forest Treehills (stretch scratch): the Bazookarp notes' numbers — the nav routes from mid to the goal spot in front
// of Alpha's spawn (the base terrace's landing-pad ring, where Tower Command's goal sits), through each of the nursery's
// ways: the centre (over the potting deck: the checkpoint spot), the west strip, the east lobe; and the unconstrained
// shortest.  MAP=treehills PAGE=…/bazookarp.js tools/botlab/run.sh tools/botlab/page.cjs
(async () => {
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const nav = __G.nav;
  const near = (x, y, z) => nav.nearest({ x, y: y + 0.5, z }, 1.2, true);
  const len = (p) => { let L = 0; for (let i = 1; i < p.length; i++) { const u = nav.nodes[p[i - 1]], v = nav.nodes[p[i]]; L += Math.hypot(v.x - u.x, v.y - u.y, v.z - u.z); } return L; };
  const mid = near(0, 1.3, -1.5), goal = near(-5.5, 1.3, -51.5);
  const via = (pts) => { let a = mid, L = 0; for (const q of [...pts.map((p) => near(...p)), goal]) { const p = nav.path(a, q, 1, 200000); if (!p) return null; L += len(p); a = q; } return +L.toFixed(1); };
  R('mid → goal (−5.5, 1.3, −51.5: the landing-pad ring): shortest', true, { m: via([]) });
  R('centre: over the potting deck (the checkpoint spot 4, 2.62, −37)', true, { m: via([[4, 2.62, -37]]) });
  R('west: down the west strip, past the orchard bank (−17.3, 1.3, −36)', true, { m: via([[-17.3, 1.3, -36]]) });
  R('west, over the orchard bank (−23.5, 1.95, −35)', true, { m: via([[-23.5, 1.95, -35]]) });
  R('east: down the lobe past the zone and the turbine (18.5, 1.3, −38)', true, { m: via([[18.5, 1.3, -38]]) });
  return out;
})()
