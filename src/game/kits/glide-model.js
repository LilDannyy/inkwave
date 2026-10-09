// [b5-sub-glide] The Glide Bomb's look: its model (registerSubModel), the world mesh and its 8 fuse lamps, and its icon.
// See kits/glide.js for the kit and tools/botlab/jobs/batch5/subs/SPEC.md §A4.
//
// A curling stone made a bomb. Prop space (hand scale): origin at the bottom centre, +Y up, +Z forward. Built Ø 0.19
// (× SUB_SCALE 1.9 = 0.36 m in the world; × SUB_VIEW_SCALE.glide 1.6 drawn = 0.58 m — visual only):
//   a dark rubber skirt ring at the base (r 0.095, h 0.012);
//   a cream "granite" lower body with a slight belly, flecked with dark speckles, to y 0.045; two hazard chevrons on
//   its front and back;
//   a dark gasket band at the equator carrying 8 lamp sockets (the lamps are per-instance meshes, team emissive: they
//   count the fuse — in the hand the cook, sliding the fuse left);
//   a team-ink upper dome to y 0.07 with a squid decal;
//   a curling handle on top: a dark gooseneck rising 0.022 from the middle, bending forward into a horizontal rubber grip
//   bar 0.07 long (the left fist holds it), an amber LED at its root.
import * as THREE from 'three';
import { G } from '../../core/ctx.js';
import { registerSubModel, getSubDef, GEO_KIT } from '../character-weapons.js';
import { lathe, smoothProfile, sweep, superEllipsoid } from '../character-geo.js';
import { getPlasticMaterial, getInkMaterial } from '../character-mats.js';
import { SUB_ICONS } from '../../ui/ui-icons.js';

const { Parts, C, M, hring, decal, squidShape, chevrons, wrapLathe, led } = GEO_KIT;
const V3 = THREE.Vector3;
export const SUB_SCALE = 1.9;                // hand-scale prop → world (subs.js SUB_SCALE: the subs all read at this size)
export const LAMPS = 8;
const BAND_Y = 0.045, BAND_R = 0.0998;       // the gasket band's outer face (the lamps and their sockets sit on it)
const LOW = smoothProfile([[0.088, 0.0105], [0.0955, 0.0175], [0.0975, 0.028], [0.0962, 0.038], [0.0935, 0.0455]], 10);
const DOME = smoothProfile([[0.0925, 0.0445], [0.089, 0.053], [0.078, 0.0615], [0.056, 0.0678], [0.028, 0.0708], [0, 0.0716]], 12);
export const LAMP_AZ = Array.from({ length: LAMPS }, (_, k) => Math.PI / 8 + (k * Math.PI) / 4);   // (off the chevrons at 0 and π)
export const GRIP = new V3(0, 0.0945, 0.016);   // the middle of the grip bar (prop space): the fist, the glow

function buildGlide() {
  const P = new Parts(), I = new Parts();
  // rubber skirt
  P.add(lathe([[0, 0], [0.084, 0], [0.093, 0.0035], [0.095, 0.009], [0.091, 0.012], [0, 0.012]], 36), C.rubber, M.rubber);
  // cream granite lower body (a slight belly), flecked
  P.add(lathe([[0, 0.0105]].concat(LOW, [[0, 0.0455]]), 40), C.cream, M.satin);
  const fl = [[0.4, 0.02, 0.0024], [1.1, 0.031, 0.0018], [1.9, 0.017, 0.0021], [2.5, 0.034, 0.0016], [3.4, 0.024, 0.0023], [4.1, 0.015, 0.0017],
    [4.8, 0.032, 0.002], [5.5, 0.022, 0.0019], [6.0, 0.036, 0.0015], [0.75, 0.037, 0.0014], [2.95, 0.014, 0.0015], [5.15, 0.016, 0.0016]];
  for (const [az, y, r] of fl) { const s = new THREE.Shape(); s.absellipse(0, 0, r * 1.25, r, 0, Math.PI * 2, false); P.add(wrapLathe(decal(s), LOW, az, y, 0.0003), C.gray, M.print); }
  for (const az of [0, Math.PI]) for (const g of chevrons(0.03, 0.011, 3, false)) { P.add(wrapLathe(g, LOW, az, 0.0225, 0.0004), C.hazard, M.gloss); }
  // the gasket band and its 8 lamp sockets
  P.add(hring(0.0948, 0.0052, BAND_Y, 6, 40), C.dark, M.gloss);
  for (const az of LAMP_AZ) P.add(at3(superEllipsoid(0.0075, 0.0058, 0.0028, 0.6, 0.6, 12, 6), az, BAND_R - 0.0008, BAND_Y), C.darker, M.satin);
  // team-ink dome, a squid decal on its front slope
  I.add(lathe([[0, 0.0445]].concat(DOME), 40));
  P.add(wrapLathe(decal(squidShape(0.024)), DOME, 0, 0.0535, 0.0005), C.decal, M.print);
  // the curling handle: a dark gooseneck up from the middle, forward into a rubber grip bar
  const neck = sweep([[0, 0.069, -0.036], [0, 0.081, -0.037], [0, 0.0915, -0.03], [0, 0.0945, -0.018], [0, 0.0945, -0.012]].map((p) => new V3(...p)),
    { seg: 16, radial: 10, capSteps: 2, radius: (t) => 0.0062 - 0.001 * t, flat: 1, outward: (Pp, o) => o.set(1, 0, 0) });
  P.add(neck.geo, C.dark, M.gloss);
  P.add(lathe([[0, 0.067], [0.0125, 0.067], [0.0118, 0.0705], [0.0085, 0.073], [0, 0.0735]], 18).translate(0, 0, -0.036), C.dark, M.gloss);   // its foot
  P.add(sweep([new V3(0, 0.0945, -0.016), new V3(0, 0.0945, 0.018), new V3(0, 0.0945, 0.052)],
    { seg: 10, radial: 12, capSteps: 3, radius: (t) => 0.0098 + 0.0007 * Math.cos(t * Math.PI * 12), flat: 1, outward: (Pp, o) => o.set(1, 0, 0) }).geo, C.rubber, M.rubber);
  led(P, new V3(0, 0.0705, -0.0505), new V3(0, 0.55, -1).normalize(), C.amber, 0.004);
  return { kind: 'glide', body: P.build(), ink: I.build(), grip: { pos: GRIP.clone(), handZ: new V3(0, -1, 0), handY: new V3(-0.3, -0.1, -1) } };   // (carried upright by its handle: its team dome shows beside the head)
}
// a part authored facing +Z at the origin, turned to azimuth az on a circle of radius r at height y
function at3(g, az, r, y) { g.rotateY(az); g.translate(Math.sin(az) * r, y, Math.cos(az) * r); return g; }
registerSubModel('glide', buildGlide);

// the lamps: a small dome facing +Z (placed per lamp)
export const LAMP_GEO = superEllipsoid(0.0062, 0.0048, 0.0026, 0.8, 0.8, 12, 6);
export function lampAt(mesh, k) { const az = LAMP_AZ[k]; mesh.position.set(Math.sin(az) * (BAND_R + 0.0006), BAND_Y, Math.cos(az) * (BAND_R + 0.0006)); mesh.rotation.set(0, az, 0); return mesh; }
// per-team lamp materials (lit: team emissive; off: dark glass) — one set each per stone (its own throb), or per hand
export function lampMats(color) {
  return {
    on: new THREE.MeshStandardMaterial({ color: color.clone().multiplyScalar(0.35), emissive: color.clone().lerp(new THREE.Color(1, 1, 1), 0.25), emissiveIntensity: 2.2, roughness: 0.3 }),
    off: new THREE.MeshStandardMaterial({ color: 0x15151b, emissive: color.clone(), emissiveIntensity: 0.04, roughness: 0.35 }),
  };
}
// how many lamps are lit for a share k (0 … 1) of the fuse / cook left: 8 … 1 (never 0 while it lives)
export const litFor = (k) => Math.max(1, Math.min(LAMPS, Math.ceil(LAMPS * k - 1e-6)));
export function setLamps(lamps, mats, n) { for (let i = 0; i < lamps.length; i++) { const m = i < n ? mats.on : mats.off; if (lamps[i].material !== m) lamps[i].material = m; } }

// ---- the world mesh: outer (at the stone's foot; yaw = its curl) → model (prop × SUB_SCALE × vs) — body, ink, 8 lamps
export function makeMesh(team, vs = 1) {
  const d = getSubDef('glide'), col = G.teamColors[team];
  const outer = new THREE.Group(), model = new THREE.Group();
  model.scale.setScalar(SUB_SCALE * vs);
  const body = new THREE.Mesh(d.body, getPlasticMaterial()); body.castShadow = true;
  const ink = new THREE.Mesh(d.ink, getInkMaterial(col)); ink.castShadow = true;
  model.add(body, ink);
  const mats = lampMats(col);
  const lamps = LAMP_AZ.map((_, k) => { const m = lampAt(new THREE.Mesh(LAMP_GEO, mats.on), k); model.add(m); return m; });
  outer.add(model);
  return { outer, model, body, ink, lamps, mats, vs };
}
export function disposeMesh(m) { m.mats.on.dispose(); m.mats.off.dispose(); }

// ---- the icon (the roster style: dark #15121c outline 3 px, light #e4e8ef fills, team colour = currentColor): the stone
// in three-quarter view — a cream lower body and a team dome, a dark band with three lit dots, the handle on top; three
// speed lines behind it and a short ink streak under it
{
  const K = '#15121c', DK = '#2b2735', LT = '#e4e8ef';
  const O = `stroke="${K}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const SL = 'M2.5 30 L9.5 30 M4.5 38.5 L10 38.5 M2.5 47 L8.5 47';
  const H = 'M30.5 22.5 L30.5 15.5 Q30.5 12 34 12 L50 12';
  SUB_ICONS.glide = `<svg class="iw-ico " viewBox="0 0 64 64" aria-hidden="true">
    <path d="M8 58.5 Q22 55.5 38 57.5" stroke="currentColor" stroke-opacity=".8" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    <g fill="none" stroke="${K}" stroke-width="6.5" stroke-linecap="round"><path d="${SL}"/></g>
    <g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="${SL}"/></g>
    <g ${O}>
      <path d="M14.5 39.5 L59.5 39.5 L59.5 45 Q59.5 54.5 37 54.5 Q14.5 54.5 14.5 45 Z" fill="${LT}"/>
      <path d="M15.5 36.5 Q15.5 24 37 23 Q58.5 24 58.5 36.5 Z" fill="currentColor"/>
      <path d="M13 36.5 Q13 34.2 15.5 34.2 L58.5 34.2 Q61 34.2 61 36.5 L61 39.2 Q61 41.5 58.5 41.5 L15.5 41.5 Q13 41.5 13 39.2 Z" fill="${DK}"/>
    </g>
    <path d="M18 49 L21 46.5 L18 44 M22.5 49 L25.5 46.5 L22.5 44" stroke="#ffcf33" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${H}" fill="none" stroke="${K}" stroke-width="8" stroke-linecap="round"/>
    <path d="${H}" fill="none" stroke="${DK}" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M38.5 12 L50 12" fill="none" stroke="#3a3f4a" stroke-width="3.6" stroke-linecap="round"/>
    <circle cx="26" cy="37.9" r="1.8" fill="#fff"/><circle cx="37" cy="37.9" r="1.8" fill="#fff"/><circle cx="48" cy="37.9" r="1.8" fill="#fff"/>
    <path d="M22 31 Q25.5 27 32 26" stroke="#fff" stroke-opacity=".6" stroke-width="3" fill="none" stroke-linecap="round"/>
  </svg>`;
}
