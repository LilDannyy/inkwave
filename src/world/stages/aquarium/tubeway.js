// Gulper Aquarium — the Tubeway's data (LAYOUT.pipes, ENGINE.md §3.3's exact format) and the blockout's reading of it:
// the centreline with its fillets, the ends, approach and landing points. Pure data (no three.js): layout.js (the
// Bazookarp noRest circles) and backdrop.js (the placeholder clear tubes) both read it. The pipe engine (src/game/
// pipes.js + src/world/pipes-data.js, not built yet) will read LAYOUT.pipes itself; nothing here is engine code.

export const PIPES = {
  label: 'TUBEWAY',              // the HUD's name for the network (≤ 14 characters)
  mirror: true,                  // every leg gets its 180° twin (id + '~'), except `single: true` legs
  enter: 'any',                  // 'any' (kid or squid) | 'squid' (a kid bumps the mouth like a wall)
  speed: 18,                     // m/s, the default for every leg (12–24)
  cooldown: 2.5,                 // s (1.5–4)
  modes: {                       // per match mode; omitted = every leg as listed
    bazookarp: { shut: [], carp: [] },   // nothing shut (no end within 15 m of a Gate); carriers refused on every leg
    boss: 'open',                // 'open' | 'off' (every leg shut, still drawn and solid)
  },
  water: [                       // looks only: volumes where the ride camera gets the underwater grade
    { cyl: [0, 0, 7.4], y: [-0.6, 2.3] },                    // the Great Tank, down to its sunken sand bed (its own twin)
    { cyl: [25, 0, 4.4], y: [0, 9.9] },                      // the E kelp drum (twin: the W drum)
    { box: [-5.9, 5.9, -30.9, -19.1], y: [6.05, 8.95] },     // the South Arch Tank over the hall (twin: the North)
  ],
  legs: [
    { id: 'gulper', way: 'two', single: true, bend: 2.0,    // the Gulper Run, through the Great Tank under the deck
      names: ['EAST GULPER', 'WEST GULPER'],
      pts: [[12.7, 0.8, 0], [9.6, 0.8, 0], [7.6, 0.5, 0], [-7.6, 0.5, 0], [-9.6, 0.8, 0], [-12.7, 0.8, 0]],
      ends: [{ nozzle: 'level' }, { nozzle: 'level' }],
      hide: [[0, 5.2], [20.2, 25.4]],                         // inside the bronze heads and necks (x 7.5…12.7)
      look: { tint: 'clear', collars: 'brass', mouth: 'gulper', deckLight: [-7.5, 7.5, -1.2, 1.2, 2.4] } },
    { id: 'arch', way: 'two', bend: 1.8,                     // the Arch Line, through the Arch Tank over the hall
      names: ['S. REEF HALL', 'S. PROMENADE'],
      twinNames: ['N. REEF HALL', 'N. PROMENADE'],
      pts: [[9.58, 0.8, -26.31], [7.32, 0.8, -27.13], [7.32, 7.5, -27.13], [-7.32, 7.5, -27.13],
            [-7.32, 3.2, -27.13], [-9.58, 3.2, -26.31]],
      ends: [{ nozzle: 'level' }, { nozzle: 'level' }],
      hide: [[0, 2.0], [25.4, 27.4]],                         // the end runs inside the pylons (the risers are glazed: drawn)
      look: { tint: 'clear', collars: 'brass' } },
    { id: 'express', way: 'one', speed: 24, bend: 2.7,        // the Express, across the wing high over the Ticket Hall
      names: ['FERRY PLAZA', 'PENGUIN POINT'],
      pts: [[23.39, 0.8, -49.02], [21.69, 0.8, -46.07], [21.69, 9.4, -46.07], [-14.29, 9.4, -37.75],
            [-14.29, 2.0, -37.75], [-15.99, 2.0, -34.8]],
      ends: [{ nozzle: 'level' }, { nozzle: 'level' }],
      hide: [[0, 4.4], [49.9, 55.1]],                         // inside the two Express stops
      look: { tint: 'clear', collars: 'steel', chevrons: true } },
    { id: 'kelp', speed: 24, bend: 2.7,                       // the Kelp Line, up the E drum, along the North Promenade
      way: { flip: { every: 90, first: 'ab', warn: 10, close: 3, reopen: 1, quietEnd: 15 } },   // the tide (E2)
      names: ['S. REEF HALL', 'N. PROMENADE'],
      twinNames: ['N. REEF HALL', 'S. PROMENADE'],
      pts: [[27.4, 0.8, -4.6], [27.4, 0.8, -1.2], [27.4, 9.0, -1.2], [21.28, 9.0, 23.63],
            [21.28, 3.2, 23.63], [18.94, 3.2, 21.03]],
      ends: [{ nozzle: 'level' }, { nozzle: 'level' }],
      hide: [[0, 0.8], [37.7, 41.8]],                         // the low stop's frame; the deep stop's housing
      look: { tint: 'clear', collars: 'steel', chevrons: true } },   // tidal: the engine adds the split-flap signs
  ],
};

// ---------------------------------------------------------------------------------------------------- the blockout's reading
// (what expandPipes will compute, enough for placeholder looks and the Bazookarp's noRest circles)
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const nrm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const turnLeg = (pts) => pts.map(([x, y, z]) => [-x, y, -z]);
// every leg with its twin: { id, way, speed, pts, single }
export function allLegs(P = PIPES) {
  const out = [];
  for (const L of P.legs) {
    out.push({ ...L, names: L.names });
    if (P.mirror && !L.single) out.push({ ...L, id: L.id + '~', pts: turnLeg(L.pts), names: L.twinNames || L.names, twin: true });
  }
  return out;
}
// the centreline as a polyline: straight runs joined by circular fillets of radius `bend`, sampled every ~0.25 m of arc
export function centreline(leg, step = 0.25) {
  const p = leg.pts, r = leg.bend || 1.5, out = [p[0]];
  for (let i = 1; i < p.length - 1; i++) {
    const a = nrm(sub(p[i - 1], p[i])), b = nrm(sub(p[i + 1], p[i]));
    const cosT = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])), th = Math.acos(cosT);   // angle between the runs
    const t = r / Math.tan(th / 2);                                  // tangent length from the corner
    const A = add(p[i], a, t), Bp = add(p[i], b, t);
    const bis = nrm(add(a, b)), C = add(p[i], bis, r / Math.sin(th / 2));   // fillet centre
    const u = nrm(sub(A, C)), v = nrm(sub(Bp, C)), phi = Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1] + u[2] * v[2])));
    const n = Math.max(2, Math.ceil((phi * r) / step));
    for (let k = 0; k <= n; k++) {   // slerp between u and v
      const s = k / n, w1 = Math.sin((1 - s) * phi) / Math.sin(phi), w2 = Math.sin(s * phi) / Math.sin(phi);
      out.push(add(C, [u[0] * w1 + v[0] * w2, u[1] * w1 + v[1] * w2, u[2] * w1 + v[2] * w2], r));
    }
  }
  out.push(p[p.length - 1]);
  return out;
}
// the two ends of a leg: mouth, outward axis (horizontal unit), mouth floor, approach point (1.0 m out), landing point
// (a level pop with no input lands 3.1 m out, on the floor below: ENGINE.md §1.3)
export function endsOf(leg) {
  const p = leg.pts, n = p.length;
  return [[p[0], p[1]], [p[n - 1], p[n - 2]]].map(([m, q], k) => {
    const o = nrm([m[0] - q[0], 0, m[2] - q[2]]), fy = m[1] - 0.8;
    const landY = leg.id.startsWith('express') && k === 1 ? 1.2 : fy;
    return { k, pos: m, out: o, floorY: fy, approach: [m[0] + o[0] * 1.0, fy, m[2] + o[2] * 1.0], land: [m[0] + o[0] * 3.1, landY, m[2] + o[2] * 3.1] };
  });
}
// which end is IN for a one-way leg (k = 0 = A) in a tide state ('up' = the first state, A→B)
export function inEnd(leg, tide = 'up') {
  if (leg.way === 'two') return [0, 1];
  if (leg.way === 'one') return [0];
  return tide === 'up' ? [0] : [1];
}
