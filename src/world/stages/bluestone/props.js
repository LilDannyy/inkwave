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
import { RAILYARD } from './layout.js';
import { rasterRects, inPoly, edgeDist } from './ground.js';
import { eraFilter } from './era.js';

const BOT = -1.8;

export function register(D, H) {
  // a plain block of the railyard (centre pos, size [w, d], top): collider `roof`, a dark mass
  D.bluestone_berm = {
    build(B, o) {
      const [w, d] = o.size, top = o.top ?? RAILYARD.top, h = top - BOT;
      B.col(-w / 2, BOT, -d / 2, w / 2, top, d / 2, { roof: true });
      if (!o.noMesh) B.box('rubber', o.color || '#3b3a37', w, h, d, 0, BOT + h / 2, 0, { r: 0.02 });
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
}

// ---- the embankment: raster rectangles over the railyard outline (reaching 0.15 m into the walls it backs onto),
// minus the stairs' channels (grown 0.3 m), then the channel fillers
const grow = (poly, x, z, d) => inPoly(poly, x, z) || edgeDist(poly, x, z) <= d;
const BERM = rasterRects((x, z) => grow(RAILYARD.poly, x, z, 0.15) && !RAILYARD.channels.some((c) => grow(c.poly, x, z, 0.25)), { x0: -63, x1: -24, z0: -85, z1: -27 });
const placements = [];
for (const [x0, x1, z0, z1] of BERM.rects) placements.push({ type: 'bluestone_berm', pos: [+((x0 + x1) / 2).toFixed(3), 0, +((z0 + z1) / 2).toFixed(3)], size: [+(x1 - x0).toFixed(3), +(z1 - z0).toFixed(3)] });
for (const c of RAILYARD.channels) {
  // the filler: the channel's own quad (a rectangle in the world or the arm's frame), turned with it
  const [a, b, , d] = c.fill, w = Math.hypot(b[0] - a[0], b[1] - a[1]), dd = Math.hypot(d[0] - a[0], d[1] - a[1]);
  const cx = (c.fill[0][0] + c.fill[2][0]) / 2, cz = (c.fill[0][1] + c.fill[2][1]) / 2;
  const rot = Math.atan2(d[0] - a[0], d[1] - a[1]);   // local z along a → d
  placements.push({ type: 'bluestone_berm', pos: [+cx.toFixed(3), 0, +cz.toFixed(3)], rotY: rot, oboxCols: true, size: [+w.toFixed(3), +dd.toFixed(3)], eras: '12', eraGroup: c.group });
}
placements.push({ type: 'bluestone_tartar', pos: [0, 0, 0], mirror: false });
export const BERM_MISS = BERM.miss;
export const PLACEMENTS = eraFilter(placements);
