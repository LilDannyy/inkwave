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
import { LAMPS, WIRES, wirePath } from './levelart.js';
import { makeKit } from './kit.js';
import { registerArch } from './arch.js';
import { registerDress } from './dress.js';

const BOT = -1.8;
const RAILYARD = { top: 3.0 };   // (round C: no railyard embankment in play; the track / train looks keep its height)

export function register(D, H) {
  // the art phase: the kit (palette, lettering, mouldings), the buildings' dressing and the street's (arch.js, dress.js)
  const KIT = makeKit(D, H);
  const { sphG, torG } = KIT;
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
  // Commander Tartar (fix round 1: the blockout box rebuilt as a cream-and-brass cradle telephone, DESIGN §5.1): a tapered
  // body on a moulded base with a brass band, a rotary dial on each face (toward Alpha and Bravo: a brass finger wheel with
  // ten finger holes over a cream number plate, the warm-lit centre card, a brass bezel and finger stop), the handset (an
  // earpiece and a mouthpiece cup on a curved grip) resting in a two-forked cradle, its curly cord down the body's end, two
  // domed brass bells and their striker under him (his back, the way he hangs), and the coiled cord he hangs by from a
  // brass rose on the drum's ceiling (y 8). No collider. A shared prop the era engine animates (src/fx/eraFx.js builds it as
  // three parts (each two or three draw calls: gloss, metal, the dial's glow) — o.part 'body' (the body, the cradle, the bells and both cords), 'dial' (both finger wheels: they spin about
  // the z axis through (0, 6.6) as he dials the year), 'handset' (lifted at the pickup, about the pivot (0, 8.2)) — so he is
  // not in the static dressing; no part = the whole telephone)
  const { THREE } = H, TAU2 = Math.PI * 2;
  // a rounded-rectangle loft (superellipse rings [y, half-x, half-z], exponent ex) with flat caps: the body's tapered shell
  const loftGeo = (rings, ex = 3.2, n = 36) => {
    const pos = [], idx = [], ring = (y, ax, az) => { const o = pos.length / 3; for (let i = 0; i < n; i++) { const a = (i / n) * TAU2, c = Math.cos(a), sn = Math.sin(a); pos.push(ax * Math.sign(c) * Math.abs(c) ** (2 / ex), y, az * Math.sign(sn) * Math.abs(sn) ** (2 / ex)); } return o; };
    const rs = rings.map(([y, ax, az]) => ring(y, ax, az));
    for (let r = 0; r < rs.length - 1; r++) for (let i = 0; i < n; i++) { const a = rs[r] + i, b = rs[r] + ((i + 1) % n), c = rs[r + 1] + ((i + 1) % n), d = rs[r + 1] + i; idx.push(a, c, b, a, d, c); }
    const side = new THREE.BufferGeometry();
    side.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); side.setIndex(idx); side.computeVertexNormals();
    // caps (own vertices, flat normals)
    const cap = (y, ax, az, up) => { const P = [0, y, 0], I = []; for (let i = 0; i < n; i++) { const a = (i / n) * TAU2, c = Math.cos(a), sn = Math.sin(a); P.push(ax * Math.sign(c) * Math.abs(c) ** (2 / ex), y, az * Math.sign(sn) * Math.abs(sn) ** (2 / ex)); }
      for (let i = 0; i < n; i++) { const a = 1 + i, b = 1 + ((i + 1) % n); if (up) I.push(0, b, a); else I.push(0, a, b); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Array.from({ length: n + 1 }, () => [0, up ? 1 : -1, 0]).flat(), 3)); g.setIndex(I); return g; };
    const top = rings[rings.length - 1], bot = rings[0];
    return [side, cap(top[0], top[1], top[2], true), cap(bot[0], bot[1], bot[2], false)].map((g) => { g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); return g; });
  };
  const TT = { cream: '#ece2c9', creamDk: '#d2c3a0', brass: '#c9a85a', brassDk: '#8f7034', ink: '#2a2622', plate: '#f3ead2' };
  let TGEO = null;
  const tGeo = () => TGEO || (TGEO = {
    base: loftGeo([[5.84, 0.96, 0.68], [5.87, 1.06, 0.78], [5.97, 1.1, 0.82], [6.0, 1.05, 0.77]]),
    band: loftGeo([[6.0, 1.055, 0.775], [6.075, 1.055, 0.775]]),
    body: loftGeo([[6.075, 1.02, 0.745], [6.6, 1.0, 0.735], [6.95, 0.975, 0.72], [7.07, 0.93, 0.665], [7.16, 0.85, 0.56], [7.22, 0.74, 0.44]]),
  });
  const helix = (path, r, pitch, k0 = 0) => {   // a coiled cord round a polyline path: r the coil, pitch per turn
    const out = [], up = new THREE.Vector3(0, 0, 1);
    for (let s = 0; s < path.length - 1; s++) {
      const A = new THREE.Vector3(...path[s]), Bv = new THREE.Vector3(...path[s + 1]), d = Bv.clone().sub(A), L = d.length(); d.normalize();
      const u = new THREE.Vector3().crossVectors(d, Math.abs(d.z) > 0.9 ? new THREE.Vector3(1, 0, 0) : up).normalize(), w = new THREE.Vector3().crossVectors(d, u);
      const m = Math.max(2, Math.round((L / pitch) * 10));
      for (let i = s ? 1 : 0; i <= m; i++) { const t = i / m, a = k0 + ((t * L) / pitch) * TAU2; const p = A.clone().addScaledVector(d, t * L).addScaledVector(u, Math.cos(a) * r).addScaledVector(w, Math.sin(a) * r); out.push([p.x, p.y, p.z]); }
      k0 += (L / pitch) * TAU2;
    }
    return out;
  };
  D.bluestone_tartar = {
    build(B, o = {}) {
      const all = !o.part, G3 = tGeo();
      if (all || o.part === 'body') {
        // the cord he hangs by: a brass rose on the ceiling, the coiled cord down to the body's top (behind the handset)
        B.cyl('metal', TT.brass, 0.17, 0.05, 0, 7.975, 0.4, { seg: 16 });
        B.cyl('metal', TT.brassDk, 0.06, 0.08, 0, 7.92, 0.4, { seg: 10 });
        B.tube('gloss', TT.ink, helix([[0, 7.9, 0.4], [0, 7.24, 0.4]], 0.045, 0.045), 0.016, { radial: 5 });
        B.cyl('metal', TT.brass, 0.07, 0.05, 0, 7.245, 0.4, { seg: 12 });
        // the body: a moulded base (darker cream), the brass band, the tapered shell
        for (const g of G3.base) B.add('gloss', g, TT.creamDk, 0, 0, 0, {});
        for (const g of G3.band) B.add('metal', g, TT.brass, 0, 0, 0, {});
        for (const g of G3.body) B.add('gloss', g, TT.cream, 0, 0, 0, {});
        // a brass bead round the shoulder
        for (const g of loftGeo([[7.06, 0.94, 0.675], [7.085, 0.925, 0.655]])) B.add('metal', g, TT.brass, 0, 0, 0, {});
        // each face's dial housing: a brass bezel, a cream number plate with the ten numbers, the finger stop (fixed)
        for (const s of [-1, 1]) {
          const z = s * 0.735;
          B.add('metal', torG(0.445, 0.03, 6, 40), TT.brass, 0, 6.6, z + s * 0.02, {});
          B.cyl('gloss', TT.plate, 0.43, 0.02, 0, 6.6, z + s * 0.01, { rx: Math.PI / 2, seg: 32 });
          const fa = -50 * Math.PI / 180;
          B.tube('metal', TT.brass, [[Math.cos(fa) * 0.36 * s, 6.6 + Math.sin(fa) * 0.36, z + s * 0.03], [Math.cos(fa) * 0.47 * s, 6.6 + Math.sin(fa) * 0.47, z + s * 0.075], [Math.cos(fa - 0.12) * 0.5 * s, 6.6 + Math.sin(fa - 0.12) * 0.5, z + s * 0.085]], 0.018, { radial: 6 });
        }
        // the cradle: two forks on the top (each two prongs with a curl), a brass boss under each
        for (const sx of [-1, 1]) {
          B.cyl('metal', TT.brass, 0.1, 0.06, sx * 0.55, 7.25, 0, { seg: 12 });
          for (const sz of [-1, 1]) B.tube('metal', TT.brass, [[sx * 0.55, 7.24, sz * 0.07], [sx * 0.55, 7.4, sz * 0.1], [sx * 0.55, 7.5, sz * 0.15], [sx * 0.55, 7.55, sz * 0.2]], 0.022, { radial: 6 });
        }
        // the handset's curly cord: from the mouthpiece's handle end down the body's +x end into it
        B.tube('gloss', TT.ink, helix([[1.1, 7.32, 0], [1.2, 6.95, 0.02], [1.16, 6.55, 0], [1.03, 6.35, 0]], 0.04, 0.04), 0.014, { radial: 5 });
        // under him: two domed brass bells and the striker between them
        for (const sx of [-1, 1]) {
          B.lathe('metal', TT.brass, [[0.0, 5.84], [0.12, 5.84], [0.22, 5.8], [0.27, 5.72], [0.285, 5.64], [0.27, 5.62], [0.0, 5.62]], sx * 0.48, 0, 0, { seg: 20 });
          B.cyl('metal', TT.brassDk, 0.03, 0.1, sx * 0.48, 5.6, 0, { seg: 8 });
        }
        B.cyl('metal', TT.brassDk, 0.025, 0.24, 0, 5.72, 0, { seg: 8 });
        B.add('metal', sphG(0.055, 10, 8), TT.brass, 0, 5.6, 0, {});
      }
      if (all || o.part === 'handset') {
        // the handset in its cradle: a curved grip (thicker toward the cups), the earpiece (−x) and the mouthpiece (+x)
        B.tube('gloss', TT.cream, [[-0.86, 7.5, 0], [-0.62, 7.6, 0], [-0.3, 7.65, 0], [0, 7.66, 0], [0.3, 7.65, 0], [0.62, 7.6, 0], [0.86, 7.5, 0]], (t) => 0.075 + 0.025 * Math.abs(t * 2 - 1) ** 2, { radial: 12 });
        for (const sx of [-1, 1]) {
          const deep = sx > 0 ? 0.04 : 0;
          B.lathe('gloss', TT.cream, [[0.0, 7.6], [0.1, 7.58], [0.15, 7.52], [0.2, 7.42 - deep], [0.245, 7.3 - deep], [0.255, 7.27 - deep]], sx * 0.9, 0, 0, { seg: 24 });
          B.add('metal', torG(0.25, 0.022, 6, 28), TT.brass, sx * 0.9, 7.27 - deep, 0, { rx: Math.PI / 2 });
          B.cyl('gloss', TT.creamDk, 0.23, 0.02, sx * 0.9, 7.275 - deep, 0, { seg: 24 });
          for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU2; B.cyl('gloss', TT.ink, 0.018, 0.012, sx * 0.9 + Math.cos(a) * 0.1, 7.268 - deep, Math.sin(a) * 0.1, { seg: 6 }); }
          B.cyl('gloss', TT.ink, 0.02, 0.012, sx * 0.9, 7.268 - deep, 0, { seg: 6 });
        }
        B.add('metal', torG(0.085, 0.012, 5, 16), TT.brass, -0.62, 7.6, 0, { ry: Math.PI / 2, rz: 0.4 });
        B.add('metal', torG(0.085, 0.012, 5, 16), TT.brass, 0.62, 7.6, 0, { ry: Math.PI / 2, rz: -0.4 });
      }
      if (all || o.part === 'dial') {
        // the finger wheels (they spin): a brass ring with ten finger holes over the number plate, the centre card lit warm
        for (const s of [-1, 1]) {
          const z = s * 0.735 + s * 0.035;
          B.lathe('metal', TT.brass, [[0.13, 0.0], [0.42, 0.0], [0.42, 0.03], [0.4, 0.04], [0.13, 0.04]], 0, 6.6, z - s * 0.02, { seg: 40, rx: s * Math.PI / 2 });
          for (let k = 0; k < 10; k++) {
            const a = (60 + k * 30) * Math.PI / 180, x = Math.cos(a) * 0.3 * s, y = 6.6 + Math.sin(a) * 0.3;   // (mirrored per face: the holes run the same way seen from either side)
            B.cyl('gloss', TT.plate, 0.068, 0.012, x, y, z + s * 0.024, { rx: Math.PI / 2, seg: 14 });
            B.add('metal', torG(0.072, 0.012, 4, 14), TT.brassDk, x, y, z + s * 0.026, {});
            B.add('gloss', sphG(0.026, 6, 4), TT.ink, x, y, z + s * 0.031, { sz: 0.3 });   // its number, read through the hole
          }
          B.cyl('gloss', TT.plate, 0.13, 0.02, 0, 6.6, z + s * 0.02, { rx: Math.PI / 2, seg: 24 });
          B.cyl('glow', '#ffe9b0', 0.1, 0.012, 0, 6.6, z + s * 0.033, { rx: Math.PI / 2, seg: 20 });   // the warmest light under the dome
          B.add('metal', torG(0.13, 0.014, 4, 24), TT.brass, 0, 6.6, z + s * 0.03, {});
        }
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
  // (fix round 2, review 2 issue 3: the two later trams were blank slabs; DESIGN §2.10 / §5.2)
  const tramFace = (B, x, y, z, nx, nz, fn) => { B.push(x, y, z, Math.atan2(nx, nz)); fn(); B.pop(); };
  // today: a low-floor tram, white and graphite with a thin yellow band (DESIGN §5.2): graphite skirts over the bogies, the
  // glazing from 1.25 to 2.6 m in separate panes in black frames, a hint of the lit saloon in each (the ceiling strip, the
  // seat backs, a grab pole), two pairs of doors per side with yellow edges, at each end a raked windscreen under the lit
  // destination blind (11 FLOUNDERS ST) and the fleet number on the dash, air-conditioning pods and the pantograph on the
  // roof. Era 2's buckets only (gloss, glow, metal, rubber)
  D.bluestone_tram = {
    build(B) {
      const { letters, pbox, rod } = KIT;
      const WH = '#e9ebea', GR = '#32373c', GD = '#1d2125', YL = '#d6aa2c', GLS = '#2c3740', REF = '#4d5c68', SEAT = '#a3aeb8', LIT = '#fff0d2', FR = '#0e1012', HEAD = '#5a5048';
      B.box('rubber', GD, 2.2, 0.3, 5.3, 0, 0.22, 0);                                        // the running gear, in shadow
      B.box('gloss', GR, 2.54, 0.46, 5.9, 0, 0.6, 0, { round: true, r: 0.06 });               // the graphite skirt band
      for (const z of [-1.95, 1.95]) B.box('gloss', GD, 2.6, 0.4, 1.55, 0, 0.43, z, { round: true, r: 0.05 });   // the skirts over the bogies
      B.box('gloss', WH, 2.6, 0.48, 6.0, 0, 1.0, 0, { round: true, r: 0.08 });               // the white body under the glazing
      B.box('gloss', YL, 2.62, 0.05, 6.02, 0, 1.2, 0);                                        // the thin yellow band
      B.box('gloss', GR, 2.56, 1.38, 5.9, 0, 1.92, 0, { round: true, r: 0.05 });              // the glazing band (graphite)
      B.box('gloss', WH, 2.6, 0.34, 6.0, 0, 2.78, 0, { round: true, r: 0.1 });                // the cant rail
      B.box('gloss', '#d5d8d9', 2.3, 0.1, 5.7, 0, 2.98, 0, { round: true, r: 0.04 });         // the roof
      for (const z of [-1.75, 1.75]) B.box('gloss', WH, 1.5, 0.24, 1.3, 0, 3.12, z, { round: true, r: 0.08 });   // air-conditioning pods
      B.box('gloss', GR, 1.0, 0.16, 0.9, 0, 3.08, 0, { round: true, r: 0.05 });              // the pantograph's pod
      rod(B, 'metal', '#8c9295', [0, 3.17, -0.36], [0, 3.6, 0.06], 0.026, { seg: 6 });        // the pantograph: a single arm, the pan across
      rod(B, 'metal', '#8c9295', [0, 3.6, 0.06], [0, 3.84, -0.22], 0.022, { seg: 6 });
      B.box('metal', '#8c9295', 1.3, 0.04, 0.1, 0, 3.86, -0.22);
      // the sides: panes and doors along the face (local x along the tram, +z out of the face)
      const panes = [[-2.3, 0.56], [-0.36, 0.64], [0.36, 0.64], [2.3, 0.56]], doors = [-1.35, 1.35];
      for (const sd of [1, -1]) tramFace(B, sd * 1.282, 0, 0, sd, 0, () => {
        for (const [cx, w] of panes) {
          B.box('gloss', GLS, w, 1.12, 0.02, cx, 1.9, 0.012);                                 // the pane
          pbox(B, 'gloss', REF, w, 0.26, 0.01, cx, 2.33, 0.023);                                // the sky in its upper part
          for (const y of [1.33, 2.47]) pbox(B, 'gloss', FR, w + 0.06, 0.045, 0.03, cx, y, 0.016);   // its black frame
          for (const x of [cx - w / 2, cx + w / 2]) pbox(B, 'gloss', FR, 0.045, 1.18, 0.03, x, 1.9, 0.016);
          B.box('glow', LIT, w - 0.12, 0.05, 0.01, cx, 2.38, 0.028, { glow: 1.4 });            // the saloon's ceiling strip seen through it
          const nk = Math.round(w / 0.32);
          for (let k = 0; k < nk; k++) {
            const sx = cx - w / 2 + 0.16 + k * 0.32;
            pbox(B, 'gloss', SEAT, 0.24, 0.3, 0.01, sx, 1.5, 0.024);                           // the seat backs
            if ((k + Math.round(cx * 3)) % 3 === 0) B.add('gloss', KIT.sphG(0.1, 8, 6), HEAD, sx, 1.78, 0.02, { sz: 0.25 });   // a passenger's head
          }
          pbox(B, 'metal', '#c4c9cc', 0.025, 1.0, 0.01, cx + w * 0.32, 1.88, 0.026);             // a grab pole
        }
        for (const dx of doors) {
          for (const lx of [dx - 0.3, dx + 0.3]) {
            B.box('gloss', WH, 0.58, 2.2, 0.03, lx, 1.43, 0.02);                              // a door leaf
            B.box('gloss', GLS, 0.42, 1.62, 0.012, lx, 1.6, 0.038);                           // its glazing
          }
          for (const ex of [dx - 0.025, dx + 0.025]) pbox(B, 'gloss', YL, 0.035, 2.2, 0.012, ex, 1.43, 0.04);   // the yellow edges where they meet
          pbox(B, 'gloss', YL, 0.035, 2.2, 0.012, dx - 0.59, 1.43, 0.04); pbox(B, 'gloss', YL, 0.035, 2.2, 0.012, dx + 0.59, 1.43, 0.04);
          B.box('glow', '#d9f2dc', 0.07, 0.07, 0.01, dx + 0.68, 1.12, 0.03, { glow: 0.8 });   // the door button
        }
      });
      // the ends: the windscreen, the destination blind over it, the fleet number on the dash, the headlights
      for (const sd of [1, -1]) tramFace(B, 0, 0, sd * 3.0, 0, sd, () => {
        B.box('gloss', GLS, 2.2, 1.22, 0.06, 0, 1.9, 0.02, { round: true, r: 0.06 });
        pbox(B, 'gloss', REF, 2.1, 0.3, 0.01, 0, 2.36, 0.055);                                // the sky in the windscreen
        pbox(B, 'gloss', '#454b52', 1.9, 0.2, 0.01, 0, 1.42, 0.055);                          // the driver's desk behind it
        B.add('gloss', KIT.sphG(0.11, 8, 6), HEAD, -0.55, 1.78, 0.05, { sz: 0.25 });          // the driver
        B.box('glow', LIT, 1.6, 0.04, 0.01, 0, 2.18, 0.056, { glow: 1.1 });                   // the cab's light
        pbox(B, 'gloss', FR, 0.04, 0.7, 0.01, 0.35, 1.7, 0.06, { rz: 0.5 });                   // a wiper
        B.box('gloss', FR, 1.84, 0.3, 0.06, 0, 2.72, 0.04);                                   // the destination blind
        letters(B, '11 FLOUNDERS ST', { h: 0.12, y: 2.66, z: 0.075, c: LIT, lit: true, glow: 1.3, flat: true, wt: 0.2, track: 0.1 });
        letters(B, '6012', { h: 0.11, y: 0.94, z: 0.06, c: GD, flat: true, wt: 0.22, mat: 'gloss' });
        for (const x of [-0.85, 0.85]) B.box('glow', '#fff4dc', 0.34, 0.1, 0.03, x, 0.78, 0.06, { glow: 1.2 });
      });
    },
  };
  // the 3000s: a glass float-tram on a glowing magnetic plinth (DESIGN §2.10): a pearl lower body hovering over the light-rail
  // plinth on a sheet of light (the gap glows: nothing seen through it), the upper body a rounded glass capsule (era 3's
  // clear 'glass' bucket) over a lit saloon with a pearl frame — ribs and posts every 1.05 m, moss-green seats, standing
  // passengers, a ceiling of light — an opaque partition along its middle (no sightline through the cover), a pearl roof
  // with white-gold seams, the line's name in light on its flanks. Era 3's buckets only (gloss, glow, rubber, glass)
  D.bluestone_floattram = {
    build(B) {
      const { letters, sphG } = KIT;
      const PE = '#eef0f2', PF = '#f6f7f8', WG = '#f4e9c8', MOSS = '#7d9468', FIG = '#5b5c66';
      B.box('rubber', '#d4d6da', 1.8, 0.28, 6.0, 0, 0.14, 0, { r: 0.05 });                    // the light-rail plinth
      B.box('glow', WG, 1.3, 0.04, 5.7, 0, 0.29, 0, { glow: 1.2 });                             // its light seam
      B.box('glow', '#ece6f6', 2.1, 0.3, 5.5, 0, 0.44, 0, { glow: 0.85 });                      // the magnetic field: the hover gap glows
      B.box('gloss', PE, 2.5, 0.72, 5.8, 0, 0.94, 0, { round: true, r: 0.26 });               // the pearl lower body
      for (const sd of [1, -1]) B.box('glow', WG, 0.03, 0.04, 5.2, sd * 1.25, 0.66, 0, { glow: 1.0 });   // its light line
      // the saloon (opaque, inside the glass)
      B.box('gloss', '#dcdde2', 2.24, 0.04, 5.3, 0, 1.31, 0);                                 // the floor
      B.box('gloss', '#e8e5ee', 0.1, 1.32, 5.2, 0, 1.97, 0);                                  // the partition along the middle
      for (const z of [-2.1, -1.05, 0, 1.05, 2.1]) {
        B.box('gloss', PF, 2.36, 0.06, 0.08, 0, 2.6, z);                                      // the pearl frame: a rib over the saloon
        for (const sd of [1, -1]) B.box('gloss', PF, 0.06, 1.3, 0.08, sd * 1.12, 1.96, z);     // and its posts
      }
      for (const sd of [1, -1]) B.box('glow', WG, 0.2, 0.03, 5.0, sd * 0.55, 2.56, 0, { glow: 0.9 });   // the ceiling of light
      for (const z of [-2.35, -1.55, 0.55, 1.35]) for (const sd of [1, -1]) {
        B.box('rubber', MOSS, 0.62, 0.12, 0.46, sd * 0.68, 1.62, z);                           // a seat (moss on pearl)
        B.box('rubber', MOSS, 0.62, 0.46, 0.09, sd * 0.68, 1.88, z + 0.22);
        B.box('gloss', PF, 0.66, 0.3, 0.5, sd * 0.68, 1.44, z);                                // its pearl base
      }
      for (const [x, z, h] of [[0.62, -0.42, 1.0], [-0.6, -0.2, 0.92], [0.7, 2.2, 0.96], [-0.66, -1.95, 1.0]]) {
        B.cyl('rubber', FIG, 0.15, h, x, 1.33 + h / 2, z, { seg: 10 });                        // standing passengers' silhouettes
        B.add('rubber', sphG(0.12, 10, 8), FIG, x, 1.33 + h + 0.13, z, {});
      }
      B.box('glass', '#e8eef2', 2.5, 1.46, 5.8, 0, 1.98, 0, { round: true, r: 0.5 });         // the glass capsule
      B.box('gloss', PE, 2.4, 0.3, 5.7, 0, 2.82, 0, { round: true, r: 0.14 });               // the pearl roof
      for (const sd of [1, -1]) B.box('glow', WG, 0.04, 0.04, 5.4, sd * 1.15, 2.72, 0, { glow: 1.2 });   // its white-gold seams
      for (const sd of [1, -1]) {
        B.box('glow', WG, 1.6, 0.06, 0.03, 0, 1.08, sd * 2.91, { glow: 1.3 });                 // the nose's light band
        tramFace(B, sd * 1.26, 0, 0, sd, 0, () => letters(B, 'FLOUNDERS ST', { h: 0.12, y: 0.9, z: 0.02, c: WG, lit: true, glow: 1.3, flat: true, wt: 0.18 }));
      }
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
// Tartar's wires from the drum (the warning's pulses run along them: layout.js eras.pulses): black wire in the 1880s and
// TODAY, a filament of light in the 3000s; their brackets and roof poles shared
const PATHS = WIRES.map((w) => wirePath(w));
placements.push({ type: 'bluestone_pulsewires', pos: [0, 0, 0], anchors: WIRES });
for (const e of ERAS3) placements.push({ type: 'bluestone_pulsewires', pos: [0, 0, 0], paths: PATHS, era: e, eras: String(e) });
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
  if (d.tag === 'garden-planter' && d.kind === 'box' && d.max[1] - d.min[1] > 2) continue;   // (fix round 1: the garden's glasshouse — glazed over, no bed on top)
  const top = d.kind === 'box' ? d.max[1] : d.center[1] + d.size[1] / 2;
  const at = d.kind === 'box' ? { pos: [(d.min[0] + d.max[0]) / 2, top, (d.min[2] + d.max[2]) / 2], rotY: 0, w: d.max[0] - d.min[0], d: d.max[2] - d.min[2] } : { pos: [d.center[0], top, d.center[2]], rotY: d.rotY * DEG, w: d.size[0], d: d.size[2] };
  const eras = d.eras ? [...d.eras].map(Number) : ERAS3;
  for (const e of eras) placements.push({ type: 'bluestone_planting', ...at, era: e, eras: String(e), ...(d.eraGroup ? { eraGroup: d.eraGroup } : {}), seed: Math.round(at.pos[0] * 13 + at.pos[2] * 7) });
}
// ---- (fix round 1) TODAY's beer-garden umbrellas in the Young & Jackfish's balcony planters (roof tops; the canopies'
//      rims 2.65 m over the balcony floor at 2.4)
for (const d of LAYOUT.half) if (d.tag === 'balcony-planter' && d.kind === 'box') placements.push({ type: 'bluestone_umbrella', pos: [(d.min[0] + d.max[0]) / 2, d.max[1], (d.min[2] + d.max[2]) / 2], floor: d.min[1] - d.max[1], r: 1.05, eras: '2' });
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
