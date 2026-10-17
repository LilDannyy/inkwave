// Bluestone Junction — stage props (prop types prefixed 'bluestone_') and set dressing (PLACEMENTS: the half list, mirrored).
//
// BLOCKOUT: no art yet. Two things live here because they must not be layout pieces:
//   • the railyard embankment (DESIGN.md §2.6 point 3): the out-of-play mass behind the viaduct and the railyard wall,
//     a `roof` collider at 3.0 (anyone landing on it slides off; the Signal Garden's deck sits on it in the 3000s). A
//     layout block would be drawn by the stage-card thumbnail and check-maps' plan as land, filling the X's railyard
//     corners; a prop collider is not. Drawn here as a plain dark mass so the pictures read "railyard, out of play".
//     (fix round 2: Prawn Alley and the signal yard lie outside its outline, so it has no channels; the Signal Garden
//     stands on the yard, a layout piece.)
//   • a placeholder of Commander Tartar under the dome (no collider): the era engine builds and animates him.
// Placements carry the era engine's tags (eras / eraGroup); the dressing is the union of every era (era.js), and the
// engine switches the tagged looks at the front (their own merged meshes per era mask: docs/STAGE-MODS.md "Props").
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
  // Commander Tartar (placeholder): a rounded cream-and-brass telephone hanging on his cord under the dome. A shared
  // prop the era engine animates (src/fx/eraFx.js builds it as three parts — o.part 'body' (the cord and the body),
  // 'dial' (both dial faces: they spin as he dials the year), 'handset' (lifted at the pickup) — so he is not in the
  // static dressing; no part = the whole telephone)
  D.bluestone_tartar = {
    build(B, o = {}) {
      const all = !o.part;
      if (all || o.part === 'body') {
        B.cyl('rubber', '#2d2a26', 0.05, 0.4, 0, 7.8, 0);                            // the cord to the drum's ceiling
        B.box('gloss', '#e9dfc7', 2.0, 1.6, 1.4, 0, 6.6, 0, { round: true, r: 0.3 });  // the body
        for (const s of [-1, 1]) B.sph('metal', '#c9a85a', 0.32, s * 0.55, 7.42, 0.55);   // the two bell domes on his back
      }
      if (all || o.part === 'handset') B.box('metal', '#b8924a', 2.2, 0.35, 0.7, 0, 7.55, 0, { round: true, r: 0.12 }); // the handset on its cradle
      if (all || o.part === 'dial') {
        B.cyl('metal', '#b8924a', 0.5, 0.08, 0, 6.6, -0.72, { rx: Math.PI / 2 });     // the dial (the face, toward Alpha)
        B.cyl('metal', '#b8924a', 0.5, 0.08, 0, 6.6, 0.72, { rx: Math.PI / 2 });      // (and toward Bravo)
        for (const z of [-0.77, 0.77]) B.cyl('glow', '#ffe9b0', 0.16, 0.02, 0, 6.6, z, { rx: Math.PI / 2 });   // the warmest light under the dome
      }
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
  // ---- the era-slot kit (DESIGN.md §2.10, §5.2): one shared collider (the layout's block, collision only) and three
  //      looks, one per era (era props: static merged parts, ≤ 5 materials per era mask, ENGINE rule 40). Local z runs
  //      along the tram; every look covers the 2.6 × 6 × 3.2 m collider
  // the 1880s: a cable tram's grip car and trailer, timber in cream and maroon, an open clerestory roof
  D.bluestone_cabletram = {
    build(B) {
      for (const z of [-2.1, 2.1]) for (const x of [-0.85, 0.85]) B.cyl('metal', '#2b2a27', 0.38, 0.14, x, 0.38, z, { rz: Math.PI / 2, seg: 12 });
      B.box('wood', '#5a3a2c', 2.5, 0.35, 5.9, 0, 0.62, 0);                          // the underframe
      B.box('wood', '#d9c7a0', 2.55, 1.1, 5.7, 0, 1.35, 0, { r: 0.04 });              // the dado, cream
      B.box('wood', '#6e2f2a', 2.58, 0.18, 5.74, 0, 1.92, 0);                         // the maroon belt
      for (const z of [-2.6, -1.3, 0, 1.3, 2.6]) for (const x of [-1.22, 1.22]) B.box('wood', '#6e2f2a', 0.1, 1.05, 0.1, x, 2.5, z);   // the window posts (open sides)
      B.box('wood', '#4b3326', 2.7, 0.16, 6.0, 0, 3.08, 0, { r: 0.04 });              // the roof
      B.box('wood', '#d9c7a0', 1.2, 0.2, 4.6, 0, 3.24, 0);                            // the clerestory
      B.box('metal', '#3a3a36', 2.2, 0.08, 0.08, 0, 1.0, -3.0); B.box('metal', '#3a3a36', 2.2, 0.08, 0.08, 0, 1.0, 3.0);   // the dashboards
    },
  };
  // today: an electric tram, green with a cream band, dark windows and a pantograph
  D.bluestone_tram = {
    build(B) {
      for (const z of [-2, 2]) B.box('rubber', '#262626', 2.0, 0.45, 1.4, 0, 0.3, z);  // the bogies
      B.box('gloss', '#4f6b52', 2.6, 1.25, 6.0, 0, 1.15, 0, { round: true, r: 0.12 });
      B.box('gloss', '#e4dcc6', 2.62, 0.22, 6.02, 0, 1.86, 0);
      B.box('gloss', '#2b3236', 2.58, 0.95, 5.7, 0, 2.45, 0, { round: true, r: 0.08 });   // the windows
      B.box('gloss', '#4f6b52', 2.6, 0.32, 6.0, 0, 3.05, 0, { round: true, r: 0.12 });
      B.box('metal', '#8c9294', 0.1, 0.5, 1.4, 0, 3.45, 0, { rx: 0.5 });                // the pantograph
      B.box('metal', '#8c9294', 1.3, 0.05, 0.1, 0, 3.72, -0.25);
      for (const z of [-3.01, 3.01]) B.box('glow', '#fff1cc', 0.5, 0.18, 0.04, 0, 1.0, z);   // headlights
    },
  };
  // the 3000s: a float-tram, a pearl capsule hovering over its light-rail plinth, a white-gold glow underneath
  D.bluestone_floattram = {
    build(B) {
      B.box('rubber', '#cfd2d4', 1.6, 0.3, 6.0, 0, 0.15, 0, { r: 0.05 });              // the light-rail plinth
      B.box('glow', '#f4e9c8', 1.2, 0.05, 5.6, 0, 0.32, 0);                            // its light seam
      B.box('gloss', '#eef0f2', 2.5, 2.1, 6.0, 0, 1.95, 0, { round: true, r: 0.85 });   // the capsule
      B.box('gloss', '#3a4650', 2.52, 0.7, 4.8, 0, 2.3, 0, { round: true, r: 0.3 });     // the window band
      B.box('glow', '#f4e9c8', 2.0, 0.06, 5.0, 0, 0.88, 0);                            // the hover glow
    },
  };
  // the street lamps on the shared lamp spots: a gas lamp (the 1880s), a street light (today), a light mast (the 3000s)
  D.bluestone_gaslamp = {
    build(B) {
      B.cyl('metal', '#2f3a35', 0.07, 3.1, 0, 1.55, 0, { seg: 8 });
      B.box('metal', '#2f3a35', 0.42, 0.06, 0.42, 0, 3.12, 0);
      B.box('glow', '#ffe0b8', 0.28, 0.36, 0.28, 0, 3.34, 0);
      B.lathe('metal', '#2f3a35', [[0.26, 3.52], [0.26, 3.56], [0, 3.8]], 0, 0, 0, { seg: 4, ry: Math.PI / 4 });
    },
  };
  D.bluestone_streetlight = {
    build(B) {
      B.cyl('metal', '#7c8285', 0.08, 5.2, 0, 2.6, 0, { seg: 8 });
      B.box('metal', '#7c8285', 0.1, 0.1, 1.5, 0, 5.15, 0.7);
      B.box('glow', '#ffd9a8', 0.3, 0.08, 0.55, 0, 5.07, 1.35);
    },
  };
  D.bluestone_lightmast = {
    build(B) {
      B.cyl('gloss', '#eef0f2', 0.06, 5.6, 0, 2.8, 0, { seg: 10 });
      B.cyl('glow', '#f4e9c8', 0.45, 0.06, 0, 5.4, 0, { seg: 20 });
      B.cyl('glow', '#f4e9c8', 0.08, 1.6, 0, 1.4, 0, { seg: 8 });
    },
  };
  // the rooftop superstructures (no colliders, above play): today's glass towers rise behind the facades, the 3000s'
  // pearl spires with light seams grow out of them (o.size [w, d], o.y0 the roof, o.top)
  D.bluestone_glasstower = {
    build(B, o) {
      const [w, d] = o.size || [4, 4], y0 = o.y0 ?? 9, top = o.top ?? 28, h = top - y0;
      B.box('gloss', '#7d93a3', w, h, d, 0, y0 + h / 2, 0, { r: 0.05 });
      for (let y = y0 + 3; y < top - 0.5; y += 3) B.box('metal', '#e4e6e6', w + 0.06, 0.12, d + 0.06, 0, y, 0);
      B.box('metal', '#c9a85a', w * 0.6, 1.2, d * 0.6, 0, top + 0.6, 0);
    },
  };
  D.bluestone_spire = {
    build(B, o) {
      const y0 = o.y0 ?? 9, top = o.top ?? 29, r = o.r ?? 2.2, h = top - y0;
      B.lathe('gloss', '#eef0f2', [[r, y0], [r * 0.92, y0 + h * 0.25], [r * 0.7, y0 + h * 0.55], [r * 0.35, y0 + h * 0.85], [0.05, top]], 0, 0, 0, { seg: 12 });
      for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + Math.PI / 4; B.box('glow', '#f4e9c8', 0.12, h * 0.8, 0.12, Math.cos(a) * r * 0.72, y0 + h * 0.4, Math.sin(a) * r * 0.72, { rz: Math.cos(a) * 0.08, rx: -Math.sin(a) * 0.08 }); }
    },
  };
  // the 3000s' lattice of light over the dome (to 22 m: DESIGN.md §5.1)
  D.bluestone_lightlattice = {
    build(B) {
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
        B.box('glow', '#f4e9c8', 0.14, 7.5, 0.14, Math.cos(a) * 6.2, 15.6, Math.sin(a) * 6.2, { rz: Math.cos(a) * 0.55, rx: -Math.sin(a) * 0.55 });
      }
      B.cyl('glow', '#f4e9c8', 2.4, 0.12, 0, 21.9, 0, { seg: 24 });
      B.cyl('gloss', '#eef0f2', 7.4, 0.25, 0, 10.6, 0, { seg: 32 });
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
// (Commander Tartar is the era engine's: src/fx/eraFx.js builds him as parts it animates)
// the landmark's and the hero buildings' blockout volumes (looks only)
placements.push({ type: 'bluestone_dome', pos: [0, 0, 0], mirror: false });
placements.push({ type: 'bluestone_clockrow', pos: [0, 0, -7.575] });
placements.push({ type: 'bluestone_turret', pos: [-12.75, 0, -19.75] });
for (const z of [-36.75, -31.25]) placements.push({ type: 'bluestone_grille', pos: [-30.75, 0, z], len: 3.5 });   // (the arcade's grilles onto Hoki Lane)
// ---- the eras' looks (look-only placements; ENGINE.md §3.3): the tram at its stop on Swimston's west track over the
//      layout's shared tram collider (collision only), the street lamps, today's towers and the 3000s' spires on the roofs
const TRAM = { pos: [-22.9, 0, -31], rotY: 0 };
placements.push({ type: 'bluestone_cabletram', ...TRAM, eras: '1' }, { type: 'bluestone_tram', ...TRAM, eras: '2' }, { type: 'bluestone_floattram', ...TRAM, eras: '3' });
// (the lamps stand in the kerb planters: on Swimston's kerbs and under the balcony; no collider, nobody stands there)
for (const [x, y, z, ry] of [[-25.3, 1.5, -44, 0], [-25.3, 1.5, -23, 0], [-15.3, 1.5, -26.5, Math.PI], [-13.7, 1.5, -14.4, Math.PI], [-8, 1.5, -16.1, Math.PI / 2]]) {
  for (const [type, eras] of [['bluestone_gaslamp', '1'], ['bluestone_streetlight', '2'], ['bluestone_lightmast', '3']]) placements.push({ type, pos: [x, y, z], rotY: ry, eras });
}
// (the spawn → dome line, DESIGN §8.3: from the spawn deck the dome stands exactly behind the GPO, so nothing stands on
//  the GPO's roof in any era — its tower and spire are on the tram shed beside the spawn deck — and the hotel's
//  extension and spire rise straight behind its turret, west of the dome's rim; eras-look part 3 checks that the dome
//  stays in sight from both spawns in every era)
placements.push({ type: 'bluestone_glasstower', pos: [-29.5, 0, -7], size: [4.4, 6], y0: 9, top: 34, eras: '2' });
placements.push({ type: 'bluestone_glasstower', pos: [-9, 0, -68], size: [3.2, 2.6], y0: 6, top: 27, eras: '2' });
placements.push({ type: 'bluestone_glasstower', pos: [-13.3, 0, -21.7], size: [1.4, 1.2], y0: 9, top: 21, eras: '2' });
placements.push({ type: 'bluestone_spire', pos: [-29.5, 0, -7], y0: 9, top: 26, r: 3, eras: '3' });
placements.push({ type: 'bluestone_spire', pos: [-9, 0, -68], y0: 6, top: 18, r: 2.2, eras: '3' });
placements.push({ type: 'bluestone_spire', pos: [-13.3, 0, -21.8], y0: 9, top: 29, r: 1.05, eras: '3' });
placements.push({ type: 'bluestone_lightlattice', pos: [0, 0, 0], mirror: false, eras: '3' });
export const BERM_MISS = [];
export const PLACEMENTS = eraFilter(placements);
