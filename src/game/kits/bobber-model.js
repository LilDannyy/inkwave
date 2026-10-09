// [b5-subs] Chain Bobber: the model (held and world), the world's instanced part geometries, and the icon.
// A fishing bobber made a bomb (tools/botlab/jobs/batch5/subs/SPEC.md C4): a sphere with a team-ink upper half and a cream
// lower half, a dark equator band with a hazard pinstripe above it, lamps on the band that show the chain's size (lit one
// per link, 1 to 4; from 5 links on they turn white-hot one by one, so 8 reads as four white lamps) — a row of four big
// lenses on each side, the second row the first turned half round, so whichever side you see it from exactly N of the
// lamps facing you are lit (the bobber turns slowly: a lamp at the edge of one row is at the middle of the other), a
// short dark stem on top ending in a metal eye-ring (the tether's anchor; the fist holds the stem), a stubby rubber keel
// spike underneath and a squid decal on each side of the cream half.
// Built at hand scale (Ø 0.10 m; the hand-held prop). In the world it's WSCALE × bigger (Ø 0.24 m, the "built" size the
// rules use) and SUB_VIEW_SCALE.bobber × bigger again to draw (Ø 0.36 m) — drawn instanced (bobber-draw.js): one geometry
// per part, the sphere's middle at the origin.
import * as THREE from 'three';
import { registerSubModel, GEO_KIT } from '../character-weapons.js';
import { lathe, superEllipsoid } from '../character-geo.js';
import { SUB_ICONS } from '../../ui/ui-icons.js';

const { Parts, C, M, at, torus, hring, gripSleeve, decal, squidShape, wrapLathe, sphZone, orient } = GEO_KIT;
const V3 = THREE.Vector3;

export const B_R = 0.05, B_CY = 0.072;                 // hand scale: the sphere's radius, its middle over the keel's tip
const STEM0 = B_CY + B_R - 0.004, STEM1 = B_CY + B_R + 0.021, RING_R = 0.0092, RING_T = 0.0024;
export const B_EYE = STEM1 + RING_R - B_CY;            // the eye-ring's middle over the sphere's middle (hand scale)
export const WSCALE = 2.4;                             // hand → world (built Ø 0.24 m)
// the lamps' places round the band: lamp k of the front row at −60° + 40° k, and again half round (the back row) — both
// rows lit alike (aLamp = k), so the half you can see always holds one of each pair
const D2R = Math.PI / 180;
export const LAMP_AZ = [-60, -20, 20, 60].map((d) => d * D2R);
const LAMPS = [...LAMP_AZ.map((az, k) => [az, k]), ...LAMP_AZ.map((az, k) => [az + Math.PI, k])];
const LAMP_R = 0.0074, LAMP_H = 0.0046;   // (a lens 1.5 cm across in the hand: 5.3 cm drawn — reads at 6–8 m)

// the parts, at a level of detail (seg: round the axis)
function parts(seg) {
  const body = new Parts(), ink = new Parts();
  // keel spike (rubber) into the bottom of the sphere
  body.add(lathe([[0, 0.0004], [0.0028, 0.0018], [0.0062, 0.013], [0.0098, 0.0245], [0, 0.0262]], Math.max(8, seg >> 1)), C.rubber, M.rubber);
  // the cream lower half / the team-ink upper half (a hair apart: the band covers the seam)
  const lowP = sphZone(B_R, B_CY, -Math.PI / 2, -0.04, Math.max(6, seg >> 2) + 4), upP = sphZone(B_R, B_CY, 0.04, Math.PI / 2, Math.max(6, seg >> 2) + 4);
  body.add(lathe(lowP, seg), C.cream, M.gloss);
  ink.add(lathe(upP, seg));
  // the dark equator band, and the hazard pinstripe above it (short arcs, yellow / dark)
  body.add(hring(B_R + 0.0006, 0.0052, B_CY, 8, seg), C.dark, M.gloss);
  const ey = 0.21, sr = B_R * Math.cos(ey) + 0.0006, sy = B_CY + B_R * Math.sin(ey), NS = 16;
  for (let k = 0; k < NS; k++) {
    const g = torus(sr, 0.00165, 5, 3, (Math.PI * 2) / NS - 0.002);
    g.rotateX(Math.PI / 2); g.rotateY((k / NS) * Math.PI * 2);
    body.add(at(g, 0, sy, 0), k % 2 ? C.hazard : C.darker, M.gloss);
  }
  // squid decals on the cream half (front and back)
  const wall = lowP.slice(1, -1);   // (the arc alone, bottom → equator: a wall profile for wrapLathe)
  for (const az of [0, Math.PI]) body.add(wrapLathe(decal(squidShape(0.024)), wall, az, B_CY - 0.031, 0.0004), C.darker, M.print);
  // the stem (the fist's grip), a collar, the metal eye-ring
  body.add(gripSleeve(STEM0, STEM1, 0.0072), C.dark, M.satin);
  body.add(lathe([[0, STEM1 - 0.002], [0.0058, STEM1 - 0.002], [0.0062, STEM1 + 0.0012], [0.0034, STEM1 + 0.0028], [0, STEM1 + 0.003]], 12), C.gunmetal, M.metal);
  body.add(at(torus(RING_R, RING_T, 6, 20), 0, STEM1 + RING_R, 0), C.metal, M.metal);
  return { body, ink };
}
// the eight lamps on the band (their own geometry: a per-vertex lamp index, aLamp 0 … 3 — each row's k-th alike)
function lampGeo(seg) {
  const list = [];
  for (const [az, k] of LAMPS) {
    const n = new V3(Math.sin(az), 0, Math.cos(az));
    const g = orient(superEllipsoid(LAMP_R, LAMP_H, LAMP_R, 1, 1, Math.max(8, seg >> 1), 5), n, new V3(n.x * (B_R + 0.0046), B_CY, n.z * (B_R + 0.0046)));
    const c = g.attributes.position.count;
    g.setAttribute('aLamp', new THREE.Float32BufferAttribute(new Float32Array(c).fill(k), 1));
    for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal' && name !== 'aLamp') g.deleteAttribute(name);
    list.push(g.index ? g.toNonIndexed() : g);
  }
  // (merge by hand: positions, normals, lamp ids)
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), L = new Float32Array(n);
  let o = 0;
  for (const g of list) {
    P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); L.set(g.attributes.aLamp.array, o);
    o += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(P, 3)); out.setAttribute('normal', new THREE.BufferAttribute(N, 3)); out.setAttribute('aLamp', new THREE.BufferAttribute(L, 1));
  return out;
}

// ---- the hand-held prop (registerSubModel: prop space, origin at the keel's tip, +Y up)
registerSubModel('bobber', () => {
  const { body, ink } = parts(32);
  for (const [az] of LAMPS) {   // (in the hand the lamps are dark lenses: it isn't in a chain yet)
    const n = new V3(Math.sin(az), 0, Math.cos(az));
    body.add(orient(superEllipsoid(LAMP_R, LAMP_H, LAMP_R, 1, 1, 12, 6), n, new V3(n.x * (B_R + 0.0046), B_CY, n.z * (B_R + 0.0046))), '#3a1012', M.lens);
  }
  return { kind: 'bobber', body: body.build(), ink: ink.build(), grip: { pos: new V3(0, (STEM0 + STEM1) / 2, 0), handZ: new V3(0, 1, 0), handY: new V3(0.3, 0.1, -1) } };
});

// ---- the world's instanced parts (built once, lower detail; the sphere's middle at the origin, hand scale — the
// instance matrix carries WSCALE × the view scale)
let WORLD = null;
export function worldGeometry() {
  if (WORLD) return WORLD;
  const { body, ink } = parts(20);
  const b = body.build().translate(0, -B_CY, 0), i = ink.build().translate(0, -B_CY, 0), l = lampGeo(16).translate(0, -B_CY, 0);
  // the white hit flash: a shell round the sphere (and its stem)
  const f = new THREE.SphereGeometry(B_R * 1.14, 16, 10);
  for (const g of [b, i, l, f]) { g.computeBoundingSphere(); g.boundingSphere.radius += 0.02; }
  WORLD = { body: b, ink: i, lamps: l, flash: f };
  return WORLD;
}

// ---- the icon (the roster's style: dark outline, light fills, team colour = currentColor): one big bobber filling the
// badge — a big team-colour cap, the cream lower half, the dark band with three lit lamps, the stem and its eye-ring, the
// keel spike — and a short tether stub off its eye-ring with a spark on it (a chain, at a glance, at badge size)
{
  const K = '#15121c', DK = '#2b2735', LT = '#e4e8ef', HZ = '#ffcf33';
  const O = `stroke="${K}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const cx = 27, cy = 36, r = 19;
  // (the stub leaves the eye-ring to the right and waves off toward the top right corner; the spark rides it)
  const ey = cy - r - 9.2, STUB = `M${cx + 3} ${ey} Q${cx + 11} ${ey + 7} ${cx + 18.5} ${ey + 3.4} Q${cx + 25} ${ey - 0.5} ${cx + 31} ${ey + 5.5}`;
  SUB_ICONS.bobber = `<svg class="iw-ico " viewBox="0 0 64 64" aria-hidden="true">
    <g fill="none" stroke="${K}" stroke-width="7" stroke-linecap="round"><path d="${STUB}"/></g>
    <g fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"><path d="${STUB}"/></g>
    <g ${O}>
      <path d="M${cx - 3.4} ${cy + r - 1.5} L${cx} ${cy + r + 6.5} L${cx + 3.4} ${cy + r - 1.5} Z" fill="${DK}"/>
      <rect x="${cx - 2.6}" y="${cy - r - 6.2}" width="5.2" height="7.2" rx="1.6" fill="${DK}"/>
      <circle cx="${cx}" cy="${ey}" r="3.3" fill="none"/>
      <path d="M${cx - r} ${cy} A${r} ${r} 0 0 0 ${cx + r} ${cy} Z" fill="${LT}"/>
      <path d="M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy} Z" fill="currentColor"/>
      <rect x="${cx - r - 1.8}" y="${cy - 3.6}" width="${2 * r + 3.6}" height="7.2" rx="3.6" fill="${DK}"/>
    </g>
    <circle cx="${cx - 8.5}" cy="${cy}" r="2.3" fill="${HZ}"/><circle cx="${cx}" cy="${cy}" r="2.3" fill="${HZ}"/><circle cx="${cx + 8.5}" cy="${cy}" r="2.3" fill="${HZ}"/>
    <path d="M${cx + 18.5} ${ey + -1.6} L${cx + 20.4} ${ey + 1.5} L${cx + 23.5} ${ey + 3.4} L${cx + 20.4} ${ey + 5.3} L${cx + 18.5} ${ey + 8.4} L${cx + 16.6} ${ey + 5.3} L${cx + 13.5} ${ey + 3.4} L${cx + 16.6} ${ey + 1.5} Z" fill="#fff" stroke="${K}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M${cx - 13} ${cy - 7.5} Q${cx - 11} ${cy - 14.5} ${cx - 4.5} ${cy - 16.5}" stroke="#fff" stroke-opacity=".6" stroke-width="3.2" fill="none" stroke-linecap="round"/>
  </svg>`;
}
