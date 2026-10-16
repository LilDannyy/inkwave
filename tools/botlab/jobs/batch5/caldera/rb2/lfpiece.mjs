const G = await import('file:///Users/danielosling/Desktop/1/st-b5-caldera/src/world/stages/caldera/geo.js');
const c = G.ST_EAST, run = 2.7, w = 2.2, half = w / 2;
const top = c.mid, foot = [c.mid[0] + c.n[0] * run, c.mid[1] + c.n[1] * run], s = [-c.n[1], c.n[0]];
const stair = [[top[0] + s[0] * half, top[1] + s[1] * half], [top[0] - s[0] * half, top[1] - s[1] * half], [foot[0] - s[0] * half, foot[1] - s[1] * half], [foot[0] + s[0] * half, foot[1] + s[1] * half]];
console.log('east steps', JSON.stringify(stair.map((p) => p.map((v) => +v.toFixed(2)))));
const segd = (p, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz))); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz); };
const polyDist = (p, P) => (G.inPoly(P, p[0], p[1]) ? -1 : Math.min(...P.map((a, i) => segd(p, a, P[(i + 1) % P.length]))));
const weir = [3, -25.5];
for (let th = -79; th <= -74; th += 0.25) {
  const ro = G.RT(th) - 0.02, d = 1.1, ri = ro - d, wa = 1.4 / ((ro + ri) / 2) / G.D / 2;
  const cs = [G.P(ri, th - wa), G.P(ri, th + wa), G.P(ro, th + wa), G.P(ro, th - wa)];
  // the box's corners (a polBox is a rectangle: approximate with the four corners)
  const wd = Math.min(...cs.map((p) => Math.hypot(p[0] - weir[0], p[1] - weir[1])));
  const sd = Math.min(...cs.map((p) => polyDist(p, stair)));
  console.log(th.toFixed(2), 'RT', G.RT(th).toFixed(2), 'weir', wd.toFixed(2), 'stair', sd.toFixed(2), JSON.stringify(cs.map((p) => p.map((v) => +v.toFixed(2)))));
}
