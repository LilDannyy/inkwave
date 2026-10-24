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
import { LAYOUT } from './layout.js';
import { LAMPS } from './levelart.js';
import { makeKit } from './kit.js';
import { registerArch } from './arch.js';
import { registerDress } from './dress.js';

const BOT = -1.8;
const RAILYARD = { top: 3.0 };   // (round C: no railyard embankment in play; the track / train looks keep its height)

export function register(D, H) {
  // the art phase: the kit (palette, lettering, mouldings), the buildings' dressing and the street's (arch.js, dress.js)
  const KIT = makeKit(D, H);
  registerArch(D, H, KIT);
  registerDress(D, H, KIT);
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
const PI = Math.PI;
const ERAS3 = [1, 2, 3];
// (Commander Tartar is the era engine's: src/fx/eraFx.js builds him as parts it animates)
// ---- the station (DESIGN.md §5.1): shared iron and stone, the dome / the drum's words / the clocks per era
placements.push({ type: 'bluestone_station', pos: [0, 0, 0] });
for (const e of ERAS3) placements.push({ type: 'bluestone_domeera', pos: [0, 0, 0], mirror: false, era: e, eras: String(e) });
for (const e of ERAS3) placements.push({ type: 'bluestone_drumletters', pos: [0, 0, 0], era: e, eras: String(e) });
for (const e of ERAS3) placements.push({ type: 'bluestone_clockfaces', pos: [0, 0, -7.575], era: e, eras: String(e) });
placements.push({ type: 'bluestone_destplates', pos: [0, 0, 0] });
// ---- the buildings: roof lines (shared), the words on them and the rooftops (per era)
placements.push({ type: 'bluestone_cornices', pos: [0, 0, 0] });
placements.push({ type: 'bluestone_turret', pos: [-12.75, 0, -19.75] });
for (const e of ERAS3) placements.push({ type: 'bluestone_signs', pos: [0, 0, 0], era: e, eras: String(e) });
for (const e of [2, 3]) placements.push({ type: 'bluestone_rooftops', pos: [0, 0, 0], era: e, eras: String(e) });
for (const z of [-36.75, -31.25]) placements.push({ type: 'bluestone_grille', pos: [-30.75, 0, z], len: 3.5 });   // (the arcade's grilles onto Hoki Lane)
placements.push({ type: 'bluestone_vault', pos: [0, 0, 0] });
for (const e of ERAS3) placements.push({ type: 'bluestone_vault', pos: [0, 0, 0], era: e, eras: String(e) });
placements.push({ type: 'bluestone_lace', pos: [0, 0, 0] });
placements.push({ type: 'bluestone_plates', pos: [0, 0, 0] });
for (const e of ERAS3) placements.push({ type: 'bluestone_hangsigns', pos: [0, 0, 0], era: e, eras: String(e) });
placements.push({ type: 'bluestone_pods', pos: [0, 0, 0], eras: '3' });
// ---- the street: the tram at its stop (the era-slot kit: one shared collider in the layout, three looks), the lamps on the
//      shared spots (the decor's light at their heads), the lanes' wall lamps, the overhead wires
const TRAM = { pos: [-22.9, 0, -31], rotY: 0 };
placements.push({ type: 'bluestone_cabletram', ...TRAM, eras: '1' }, { type: 'bluestone_tram', ...TRAM, eras: '2' }, { type: 'bluestone_floattram', ...TRAM, eras: '3' });
const LAMP_Y = [1.5, 1.5, 2.2, 1.5, 1.3, 1.2];   // the planters' tops the lamps stand in (levelart.js LAMPS)
LAMPS.forEach(([x, z], i) => { for (const e of ERAS3) placements.push({ type: 'bluestone_lamp', pos: [x, LAMP_Y[i], z], rotY: x > 0 ? PI : 0, era: e, eras: String(e) }); });
for (const [x, y, z, ry] of [[-36.5, 3.2, -45, PI / 2], [-36.5, 3.2, -37, PI / 2], [-36.5, 3.2, -31, PI / 2], [-36.5, 3.2, -21, PI / 2], [-12.0, 3.0, -22.5, PI], [-13.5, 3.0, -46.0, PI], [-30.0, 3.4, -12.0, PI], [-31.0, 3.0, -34.0, -PI / 2]]) {
  for (const e of ERAS3) placements.push({ type: 'bluestone_walllamp', pos: [x, 0, z], rotY: ry, y, era: e, eras: String(e) });
}
for (const e of [1, 2]) placements.push({ type: 'bluestone_wires', pos: [0, 0, 0], era: e, eras: String(e) });
// ---- the railings: one per rail collider of the half list, its kind by its tag (an era rail keeps its piece's eras and group)
const DEG = Math.PI / 180;
function railOf(d) {
  if (d.kind === 'box') {
    const dx = d.max[0] - d.min[0], dz = d.max[2] - d.min[2], alongX = dx >= dz;
    return { pos: [(d.min[0] + d.max[0]) / 2, d.min[1], (d.min[2] + d.max[2]) / 2], rotY: alongX ? 0 : -Math.PI / 2, len: alongX ? dx : dz, h: d.max[1] - d.min[1] };
  }
  if (d.kind === 'obox') {
    const alongX = d.size[0] >= d.size[2], a = d.rotY * DEG;
    return { pos: [d.center[0], d.center[1] - d.size[1] / 2, d.center[2]], rotY: alongX ? a : a - Math.PI / 2, len: alongX ? d.size[0] : d.size[2], h: d.size[1] };
  }
  return null;
}
for (const d of LAYOUT.half) {
  if (!d.rail || d.tag === 'arcade-grille') continue;
  const r = railOf(d);
  if (!r) continue;
  const g = d.eraGroup ? { eraGroup: d.eraGroup } : {};
  if (d.tag === 'bridge-rail') {
    placements.push({ type: 'bluestone_rail', ...r, kind: 'lattice', eras: '2', ...g }, { type: 'bluestone_rail', ...r, kind: 'glass', eras: '3', ...g });
    continue;
  }
  const kind = d.tag === 'balustrade' ? 'lace' : d.tag === 'punt-rail' ? 'rope' : d.tag === 'deck-rail' ? (d.min && d.min[1] > 3 ? 'gallery' : 'timber') : /glass|halo/.test(d.tag) ? 'glass' : 'gallery';
  placements.push({ type: 'bluestone_rail', ...r, kind, ...(d.eras ? { eras: d.eras } : {}), ...g });
}
// ---- the planting on the planters' tops (roof tops only: nobody stands there), per era; the Halo's and the garden's
//      planters exist in the 3000s only (their own group)
for (const d of LAYOUT.half) {
  if (!/planter/.test(d.tag || '') || !d.roof) continue;
  const top = d.kind === 'box' ? d.max[1] : d.center[1] + d.size[1] / 2;
  const at = d.kind === 'box' ? { pos: [(d.min[0] + d.max[0]) / 2, top, (d.min[2] + d.max[2]) / 2], rotY: 0, w: d.max[0] - d.min[0], d: d.max[2] - d.min[2] } : { pos: [d.center[0], top, d.center[2]], rotY: d.rotY * DEG, w: d.size[0], d: d.size[2] };
  const eras = d.eras ? [...d.eras].map(Number) : ERAS3;
  for (const e of eras) placements.push({ type: 'bluestone_planting', ...at, era: e, eras: String(e), ...(d.eraGroup ? { eraGroup: d.eraGroup } : {}), seed: Math.round(at.pos[0] * 13 + at.pos[2] * 7) });
}
// ---- the small things on and round the cover (art phase, from the era-1 sweep): cast-iron bollards on the mooring blocks
//      (roof tops), rowing eights on the Boathouse's racks (a roof top), hitching rings (1880s) / bike hoops (TODAY) on the
//      bollard blocks' faces (within 4 cm)
for (const d of LAYOUT.half) {
  if (d.tag === 'mooring-post' && d.kind === 'box') placements.push({ type: 'bluestone_bollardcap', pos: [(d.min[0] + d.max[0]) / 2, d.max[1], (d.min[2] + d.max[2]) / 2] });
  if (d.tag === 'mooring-post' && d.kind === 'obox') placements.push({ type: 'bluestone_bollardcap', pos: [d.center[0], d.center[1] + d.size[1] / 2, d.center[2]] });
  if (d.tag === 'deck-racks') placements.push({ type: 'bluestone_shells', pos: [(d.min[0] + d.max[0]) / 2, d.max[1], (d.min[2] + d.max[2]) / 2], rotY: Math.PI / 2, len: d.max[0] - d.min[0] });
  if (d.tag === 'bollards' && d.kind === 'box') {
    const at = { pos: [(d.min[0] + d.max[0]) / 2, d.min[1], (d.min[2] + d.max[2]) / 2], w: d.max[0] - d.min[0], d: d.max[2] - d.min[2], h: d.max[1] - d.min[1], ...(d.notIn ? { notIn: d.notIn } : {}) };
    placements.push({ type: 'bluestone_rings', ...at, eras: '1' }, { type: 'bluestone_hoops', ...at, eras: '2' });
  }
}
// (the spawn → dome line, DESIGN §8.3: from the spawn deck the dome stands exactly behind the GPO, so nothing tall stands on
//  the GPO's roof in any era — its tower and spire are on the tram shed beside the spawn deck — and the hotel's extension
//  and spire rise straight behind its turret, west of the dome's rim; eras-look part 3 checks that the dome stays in sight
//  from both spawns in every era)
placements.push({ type: 'bluestone_glasstower', pos: [-29.5, 0, -7], size: [4.4, 6], y0: 9, top: 34, eras: '2' });
placements.push({ type: 'bluestone_glasstower', pos: [-9, 0, -68], size: [3.2, 2.6], y0: 6, top: 27, eras: '2' });
placements.push({ type: 'bluestone_glasstower', pos: [-13.3, 0, -21.7], size: [1.4, 1.2], y0: 9, top: 21, eras: '2' });
placements.push({ type: 'bluestone_spire', pos: [-29.5, 0, -7], y0: 9, top: 26, r: 3, eras: '3' });
placements.push({ type: 'bluestone_spire', pos: [-9, 0, -68], y0: 6, top: 18, r: 2.2, eras: '3' });
placements.push({ type: 'bluestone_spire', pos: [-13.3, 0, -21.8], y0: 9, top: 29, r: 1.05, eras: '3' });
export const BERM_MISS = [];
export const PLACEMENTS = eraFilter(placements);
