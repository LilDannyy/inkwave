// Bluestone Junction — stage props (prop types prefixed 'bluestone_') and set dressing (PLACEMENTS: the half list, mirrored).
//
// BLOCKOUT: no art yet. Two things live here because they must not be layout pieces:
//   • the railyard embankment (DESIGN.md §2.6 point 3): the out-of-play mass behind the viaduct and the railyard wall,
//     a `roof` collider at 3.0 (anyone landing on it slides off; the Signal Garden's deck sits on it in the 3000s). A
//     layout block would be drawn by the stage-card thumbnail and check-maps' plan as land, filling the X's railyard
//     corners; a prop collider is not. Drawn here as a plain dark mass so the pictures read "railyard, out of play".
//     Its channels for the garden's three stairs are open in every era and filled in the 1880s and today (eras '12', in
//     the stair's group: ENGINE rule 19).
//   • a placeholder of Commander Tartar under the dome (no collider), so mid reads as the place it is.
// Placements carry the era engine's tags (eras / eraGroup) and are filtered by era.js like the layout.
import { RAILYARD, AL } from './layout.js';
import { rasterRects, inPoly, edgeDist } from './ground.js';
import { eraFilter } from './era.js';

const BOT = -1.8;

export function register(D, H) {
  // a plain block of the railyard (centre pos, size [w, d], top): collider `roof`, a dark mass
  D.bluestone_berm = {
    build(B, o) {
      const [w, d] = o.size, top = o.top ?? RAILYARD.top, h = top - BOT;
      B.col(-w / 2, BOT, -d / 2, w / 2, top, d / 2, { roof: true });
      if (!o.noMesh) B.box('rubber', o.color || '#47433d', w, h, d, 0, BOT + h / 2, 0, { r: 0.02 });
    },
  };
  // Commander Tartar (placeholder): a rounded cream-and-brass telephone hanging on his cord under the dome
  D.bluestone_tartar = {
    build(B) {
      B.cyl('rubber', '#2d2a26', 0.05, 0.4, 0, 7.8, 0);                            // the cord to the drum's ceiling
      B.box('gloss', '#e9dfc7', 2.0, 1.6, 1.4, 0, 6.6, 0, { round: true, r: 0.3 });  // the body
      B.box('metal', '#b8924a', 2.2, 0.35, 0.7, 0, 7.55, 0, { round: true, r: 0.12 }); // the handset on its cradle
      B.cyl('metal', '#b8924a', 0.5, 0.08, 0, 6.6, -0.72, { rx: Math.PI / 2 });     // the dial (the face, toward Alpha)
      B.cyl('metal', '#b8924a', 0.5, 0.08, 0, 6.6, 0.72, { rx: Math.PI / 2 });      // (and toward Bravo)
    },
  };
  // ---- blockout volumes with the real silhouettes (no colliders: the layout's hidden blocks collide; plain colours,
  //      no detail — the art pass replaces them)
  // the station's copper dome on the drum (y 10), its octagonal lantern and finial to 20 m (DESIGN.md §1: drum 8–10,
  // dome to 15, lantern to 19)
  D.bluestone_dome = {
    build(B) {
      const CU = '#9b7a4e';
      B.lathe('metal', CU, [[7.05, 9.98], [7.05, 10.5], [6.85, 11.3], [6.3, 12.3], [5.4, 13.3], [4.1, 14.2], [2.6, 14.85], [1.4, 15.1], [0, 15.12]], 0, 0, 0, { seg: 28 });
      B.lathe('rubber', '#cdbf9f', [[8.95, 9.98], [8.95, 10.2], [7.05, 10.2], [7.05, 9.98]], 0, 0, 0, { seg: 8, ry: Math.PI / 8, closed: true });   // the drum's cornice
      B.cyl('rubber', '#cdbf9f', 1.75, 2.4, 0, 16.2, 0, { seg: 8 });                                            // the lantern
      B.lathe('metal', CU, [[1.95, 17.4], [1.95, 17.6], [1.3, 18.4], [0.45, 19.0], [0, 19.05]], 0, 0, 0, { seg: 16 });
      B.sph('metal', '#c9a85a', 0.28, 0, 19.3, 0); B.cyl('metal', '#c9a85a', 0.05, 1.4, 0, 20.1, 0);
    },
  };
  // a row of five clocks hung on the clock beam over the Clock Steps (faces both ways; DESIGN.md §2.6 "clock beam")
  D.bluestone_clockrow = {
    build(B) {
      for (const x of [-2.48, -1.24, 0, 1.24, 2.48]) for (const s of [-1, 1]) {
        B.cyl('metal', '#2f3a35', 0.57, 0.08, x, 5.15, s * 0.3, { rx: Math.PI / 2, seg: 16 });
        B.cyl('gloss', '#f1e9d2', 0.5, 0.06, x, 5.15, s * 0.33, { rx: Math.PI / 2, seg: 16 });
        B.box('rubber', '#2a2a28', 0.06, 0.4, 0.02, x, 5.3, s * 0.37);
      }
    },
  };
  // the Young & Jackfish's corner turret over the prow (y 9 → 13) with its conical cap (the layout's turret block is
  // collision only)
  D.bluestone_turret = {
    build(B) {
      B.cyl('rubber', '#c6b597', 1.25, 4.2, 0, 11.1, 0, { seg: 12 });
      B.lathe('metal', '#59606a', [[1.5, 13.2], [1.5, 13.45], [0.15, 16.0], [0, 16.05]], 0, 0, 0, { seg: 12 });
    },
  };
  // the GPO's clock tower cap (a hipped spire) and its clock faces on the street sides (tower x −13.5 … −11,
  // z −42.5 … −40, to 16 m)
  D.bluestone_gpotower = {
    build(B) {
      B.lathe('metal', '#5f6d66', [[1.85, 15.98], [1.85, 16.2], [0, 19.2]], 0, 0, 0, { seg: 4, ry: Math.PI / 4 });
      B.cyl('gloss', '#f1e9d2', 0.75, 0.08, 1.29, 14.2, 0, { rz: Math.PI / 2, seg: 16 });
      B.cyl('gloss', '#f1e9d2', 0.75, 0.08, 0, 14.2, 1.29, { rx: Math.PI / 2, seg: 16 });
    },
  };
  // the railyard behind the viaduct (out of play): track pairs and parked trains standing on the embankment's roof, so
  // the corners read as a railyard, not a void (o.len along local z)
  D.bluestone_track = {
    build(B, o) {
      const L = o.len, y = (o.top ?? RAILYARD.top) + 0.06;
      B.box('rubber', '#5b544b', 2.6, 0.1, L, 0, y - 0.03, 0, { r: 0.01 });                 // ballast
      for (const s of [-0.72, 0.72]) B.box('metal', '#8a8a86', 0.1, 0.12, L, s, y + 0.06, 0, { r: 0.01 });
    },
  };
  D.bluestone_train = {
    build(B, o) {
      const n = o.cars || 3, L = o.carLen || 9, y = (o.top ?? RAILYARD.top) + 0.12, c = o.color || '#4d5a52';
      for (let i = 0; i < n; i++) {
        const z = (i - (n - 1) / 2) * (L + 0.6);
        B.box('rubber', '#2c2b29', 2.2, 0.9, L - 0.4, 0, y + 0.45, z, { r: 0.05 });
        B.box(o.mat || 'wood', i === 0 && o.loco ? '#2f3431' : c, 2.8, 2.8, L, 0, y + 0.9 + 1.4, z, { r: 0.12 });
        if (i === 0 && o.loco) B.cyl('metal', '#26292a', 0.35, 1.4, 0, y + 4.3, z + L * 0.3, { seg: 10 });   // the funnel
      }
    },
  };
  // an iron shopfront grille (blockout look of the arcade's two openings onto Hoki Lane: the layout's rail block collides,
  // this only shows it; o.len along local z, 3 m tall, bars every 0.25 m)
  D.bluestone_grille = {
    build(B, o) {
      const L = o.len || 3.5, n = Math.round(L / 0.25);
      for (let i = 0; i <= n; i++) B.box('metal', '#2f3a35', 0.06, 3.0, 0.06, 0, 1.5, -L / 2 + (i * L) / n);
      for (const y of [0.05, 1.2, 2.95]) B.box('metal', '#2f3a35', 0.08, 0.1, L, 0, y, 0);
    },
  };
  // the old signal box (the 1880s, today): where the Signal Garden's glass pavilion stands in the 3000s
  D.bluestone_signalbox = {
    build(B) {
      B.box('wood', '#7a5a44', 4.2, 4.6, 4.2, 0, RAILYARD.top + 2.3, 0, { r: 0.05 });
      B.lathe('metal', '#4f585e', [[3.2, RAILYARD.top + 4.55], [3.2, RAILYARD.top + 4.75], [0, RAILYARD.top + 6.4]], 0, 0, 0, { seg: 4, ry: Math.PI / 4 });
    },
  };
}

// ---- the embankment: raster rectangles over the railyard outline (reaching 0.15 m into the walls it backs onto),
// minus the stairs' channels (grown 0.3 m), then the channel fillers
const grow = (poly, x, z, d) => inPoly(poly, x, z) || edgeDist(poly, x, z) <= d;
// the open river edge (the outline's last edge: the bounds back to the wharf's corner) gets one straight block; the
// raster stays 1.2 m behind it (no saw-tooth over the water)
const RP = RAILYARD.poly, E0 = RP[RP.length - 1], E1 = RP[0];
const riverEdge = (x, z) => { const dx = E1[0] - E0[0], dz = E1[1] - E0[1], L = Math.hypot(dx, dz); const t = ((x - E0[0]) * dx + (z - E0[1]) * dz) / (L * L); return t > -0.05 && t < 1.05 ? Math.abs((x - E0[0]) * dz - (z - E0[1]) * dx) / L : Infinity; };
// (fix round 1: the embankment stands lower, at RAILYARD.low.top, under the Signal Garden; its cells there are laid apart)
const LOW = RAILYARD.low, inLow = (x, z) => inPoly(LOW.poly, x, z);
const bermCell = (x, z) => grow(RAILYARD.poly, x, z, 0.15) && riverEdge(x, z) > 1.2 && !RAILYARD.channels.some((c) => grow(c.poly, x, z, 0.25));
const BERM = rasterRects((x, z) => bermCell(x, z) && !inLow(x, z), { x0: -63, x1: -24, z0: -85, z1: -27 });
const BERM_LOW = rasterRects((x, z) => bermCell(x, z) && inLow(x, z), { x0: -63, x1: -24, z0: -85, z1: -27 });
const placements = [];
for (const [rects, top] of [[BERM.rects, undefined], [BERM_LOW.rects, LOW.top]]) for (const [x0, x1, z0, z1] of rects) placements.push({ type: 'bluestone_berm', pos: [+((x0 + x1) / 2).toFixed(3), 0, +((z0 + z1) / 2).toFixed(3)], size: [+(x1 - x0).toFixed(3), +(z1 - z0).toFixed(3)], top });
// a block over a quad (a rectangle in the world or the arm's frame), turned with it (top: the low embankment's where the
// quad's centre lies under the garden)
const quadBerm = (q, o = {}) => {
  const [a, b, , d] = q, w = Math.hypot(b[0] - a[0], b[1] - a[1]), dd = Math.hypot(d[0] - a[0], d[1] - a[1]);
  const cx = (q[0][0] + q[2][0]) / 2, cz = (q[0][1] + q[2][1]) / 2, rot = Math.atan2(d[0] - a[0], d[1] - a[1]);   // local z along a → d
  return { type: 'bluestone_berm', pos: [+cx.toFixed(3), 0, +cz.toFixed(3)], rotY: rot, oboxCols: true, size: [+w.toFixed(3), +dd.toFixed(3)], top: inLow(cx, cz) ? LOW.top : undefined, ...o };
};
for (const c of RAILYARD.channels) {
  for (const [q, group] of c.fills) placements.push(quadBerm(q, { eras: '12', eraGroup: group }));   // the 1880s / today filler
  for (const q of c.sides || []) placements.push(quadBerm(q));                                        // the trench's walls (every era)
}
{ // the straight river-edge block, 2 m wide inside the edge
  const dx = E1[0] - E0[0], dz = E1[1] - E0[1], L = Math.hypot(dx, dz), nx = dz / L, nz = -dx / L;   // (inward: the railyard side)
  const s = inPoly(RP, (E0[0] + E1[0]) / 2 + nx, (E0[1] + E1[1]) / 2 + nz) ? 1 : -1;
  placements.push({ type: 'bluestone_berm', pos: [+((E0[0] + E1[0]) / 2 + s * nx).toFixed(3), 0, +((E0[1] + E1[1]) / 2 + s * nz).toFixed(3)], rotY: Math.atan2(dx, dz), oboxCols: true, size: [2, +L.toFixed(3)] });
}
placements.push({ type: 'bluestone_tartar', pos: [0, 0, 0], mirror: false });
for (const z of [-39.75, -32.25]) placements.push({ type: 'bluestone_grille', pos: [-18.75, 0, z], len: 3.5 });   // (the arcade's grilles onto Hoki Lane)
// the landmark's and the hero buildings' blockout volumes (looks only)
placements.push({ type: 'bluestone_dome', pos: [0, 0, 0], mirror: false });
placements.push({ type: 'bluestone_clockrow', pos: [0, 0, -7.575] });
placements.push({ type: 'bluestone_turret', pos: [-12.75, 0, -19.75] });
placements.push({ type: 'bluestone_gpotower', pos: [-12.25, 0, -41.25] });
// the railyard's outer part (south of the Signal Garden, every era): track pairs along z and parked trains on them;
// the old signal box (the 1880s, today) where the garden's pavilion stands in the 3000s (its group: rule 19's swap)
for (const x of [-60, -56.5, -53, -49.5, -46, -42.5, -39, -35.5, -32]) placements.push({ type: 'bluestone_track', pos: [x, 0, -68], len: 33 });
placements.push({ type: 'bluestone_train', pos: [-56.5, 0, -66], cars: 3, loco: true, color: '#5a4a3c' });
placements.push({ type: 'bluestone_train', pos: [-46, 0, -72], cars: 2, color: '#4d5a52' });
placements.push({ type: 'bluestone_train', pos: [-35.5, 0, -63], cars: 2, loco: true, color: '#6b5a48' });
{ const [x, z] = AL(9.8, -10.9); placements.push({ type: 'bluestone_signalbox', pos: [x, 0, z], size: [4.2, 4.2], eras: '12', eraGroup: 'garden-s2' }); }   // (where the 3000s' signal mast stands)
export const BERM_MISS = [...BERM.miss, ...BERM_LOW.miss];
export const PLACEMENTS = eraFilter(placements);
