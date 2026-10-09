// [b5-subs] Chain Bobber: the model (held and world), the world's instanced part geometries, and the icon.
// A fishing bobber made a bomb (tools/botlab/jobs/batch5/subs/SPEC.md C4): a sphere with a team-ink upper half and a cream
// lower half, a dark equator band with a hazard pinstripe above it, four small lamps on the band (they show the chain's
// size: lit one per link, 1 to 4; from 5 links on they turn white-hot one by one, so 8 reads as four white lamps), a
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
export const LAMP_AZ = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];

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
// the four lamps on the band (their own geometry: a per-vertex lamp index, aLamp 0 … 3)
function lampGeo(seg) {
  const list = [];
  for (let k = 0; k < 4; k++) {
    const az = LAMP_AZ[k], n = new V3(Math.sin(az), 0, Math.cos(az));
    const g = orient(superEllipsoid(0.0043, 0.0026, 0.0043, 1, 1, Math.max(8, seg >> 1), 5), n, new V3(n.x * (B_R + 0.0052), B_CY, n.z * (B_R + 0.0052)));
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
  for (let k = 0; k < 4; k++) {   // (in the hand the lamps are dark lenses: it isn't in a chain yet)
    const az = LAMP_AZ[k], n = new V3(Math.sin(az), 0, Math.cos(az));
    body.add(orient(superEllipsoid(0.0043, 0.0026, 0.0043, 1, 1, 12, 6), n, new V3(n.x * (B_R + 0.0052), B_CY, n.z * (B_R + 0.0052))), '#3a1012', M.lens);
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

// ---- the icon (the roster's style: dark outline, light fills, team colour = currentColor): two bobbers, the right
// one higher, joined by a wavy tether with a spark star in the middle; lamps on their bands, keels under them
{
  const K = '#15121c', DK = '#2b2735', LT = '#e4e8ef', HZ = '#ffcf33';
  const O = `stroke="${K}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const bob = (x, y) => `
      <path d="M${x - 2} ${y + 9} L${x} ${y + 14.5} L${x + 2} ${y + 9} Z" fill="${DK}"/>
      <path d="M${x} ${y - 10} L${x} ${y - 14}" fill="none"/>
      <circle cx="${x}" cy="${y - 16.6}" r="2.6" fill="none"/>
      <path d="M${x - 10} ${y} A10 10 0 0 0 ${x + 10} ${y} Z" fill="${LT}"/>
      <path d="M${x - 10} ${y} A10 10 0 0 1 ${x + 10} ${y} Z" fill="currentColor"/>
      <rect x="${x - 11.5}" y="${y - 2.4}" width="23" height="4.8" rx="2.4" fill="${DK}"/>`;
  const lamps = (x, y) => `<circle cx="${x - 5}" cy="${y}" r="1.35" fill="${HZ}"/><circle cx="${x}" cy="${y}" r="1.35" fill="${HZ}"/><circle cx="${x + 5}" cy="${y}" r="1.35" fill="${HZ}"/>`;
  const TETHER = 'M20.2 25.4 Q25 13.4 31.5 18.5 Q38 23.6 42.8 11.6';
  SUB_ICONS.bobber = `<svg class="iw-ico " viewBox="0 0 64 64" aria-hidden="true">
    <g fill="none" stroke="${K}" stroke-width="6" stroke-linecap="round"><path d="${TETHER}"/></g>
    <g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="${TETHER}"/></g>
    <g ${O}>${bob(18, 44)}${bob(45, 30)}</g>
    ${lamps(18, 44)}${lamps(45, 30)}
    <path d="M31.5 12.3 L33.2 16.8 L37.7 18.5 L33.2 20.2 L31.5 24.7 L29.8 20.2 L25.3 18.5 L29.8 16.8 Z" fill="#fff" stroke="${K}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M12 40.4 Q13.5 36.4 17 35.4" stroke="#fff" stroke-opacity=".6" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M39 26.4 Q40.5 22.4 44 21.4" stroke="#fff" stroke-opacity=".6" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  </svg>`;
}
