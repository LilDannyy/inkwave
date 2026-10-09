// Bluestone Junction — stage props (prop types prefixed 'bluestone_') and set dressing (PLACEMENTS: the half list, mirrored).
//
// BLOCKOUT: no art yet. Two things live here because they must not be layout pieces:
//   • the railyard embankment (DESIGN.md §2.6 point 3): the out-of-play mass behind the viaduct and the railyard wall,
//     a `roof` collider at 3.0 (anyone landing on it slides off; the Signal Garden's deck sits on it in the 3000s). A
//     layout block would be drawn by the stage-card thumbnail and check-maps' plan as land, filling the X's railyard
//     corners; a prop collider is not. Drawn here as a plain dark mass so the pictures read "railyard, out of play".
//     (fix round 2: Prawn Alley and the signal yard lie outside its outline, so it has no channels; the Signal Garden
//     stands on the yard, a layout piece.)
//   • a placeholder of Commander Tartar under the dome (no collider), so mid reads as the place it is.
// Placements carry the era engine's tags (eras / eraGroup) and are filtered by era.js like the layout.
import { eraFilter } from './era.js';

const BOT = -1.8;
const RAILYARD = { top: 3.0 };   // (round C: no railyard embankment in play; the track / train looks keep its height)

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
        B.cyl('metal', '#2f3a35', 0.57, 0.08, x, 5.95, s * 0.3, { rx: Math.PI / 2, seg: 16 });
        B.cyl('gloss', '#f1e9d2', 0.5, 0.06, x, 5.95, s * 0.33, { rx: Math.PI / 2, seg: 16 });
        B.box('rubber', '#2a2a28', 0.06, 0.4, 0.02, x, 6.1, s * 0.37);
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
  // an iron railing (blockout look of the signal yard's fence: the layout's rail blocks collide, this only shows them;
  // o.len along local z, o.h tall, standing at the placement's y)
  D.bluestone_fence = {
    build(B, o) {
      const L = o.len || 3, h = o.h || 1.4, y = o.y0 || 0, n = Math.max(1, Math.round(L / 0.3));
      for (let i = 0; i <= n; i++) B.box('metal', '#2f3a35', 0.05, h, 0.05, 0, y + h / 2, -L / 2 + (i * L) / n);
      for (const yy of [0.12, h - 0.04]) B.box('metal', '#2f3a35', 0.07, 0.08, L, 0, y + yy, 0);
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

const placements = [];
placements.push({ type: 'bluestone_tartar', pos: [0, 0, 0], mirror: false });
// the landmark's and the hero buildings' blockout volumes (looks only)
placements.push({ type: 'bluestone_dome', pos: [0, 0, 0], mirror: false });
placements.push({ type: 'bluestone_clockrow', pos: [0, 0, -7.575] });
placements.push({ type: 'bluestone_turret', pos: [-12.75, 0, -19.75] });
for (const z of [-36.75, -31.25]) placements.push({ type: 'bluestone_grille', pos: [-30.75, 0, z], len: 3.5 });   // (the arcade's grilles onto Hoki Lane)
export const BERM_MISS = [];
export const PLACEMENTS = eraFilter(placements);
