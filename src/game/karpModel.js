// [karp-face] The Bazookarp itself (SPEC §1, §6.7): a koi carp made into an ink bazooka by a Grizzco-adjacent prop
// shop, worn on the shoulder like the Twister Zooka. The held model 'sp_karp' (registerWeaponModel: the carrier's
// hands, character.js ANIM_OF.sp_karp = 'sp_zooka') and the resting one the looks draw in the Pond (karpRestMesh).
// Weapon space (character-weapons.js): grip centre at the origin, +Z forward, +Y up, the character's right = −X.
//   • the body: a plump koi, 1.0 m from the tail fin to the lips, cream-white, its scales the carrier's team ink in
//     kohaku patches (resting: white-gold all over); the mouth is the muzzle (an open "O": coral lips, a dark throat,
//     an ink core that glows with the charge); big cartoon eyes, gill line, two barbels
//   • the back: a row of six fishing floats (the float-scales), team ink over white, each with its little antenna
//   • the tail fin is the shoulder end (it flaps), the pectoral fins flank the left hand's foregrip, a pistol grip
//     under the belly for the right hand, a rubber shoulder pad under the back half
// Part animation (animateKarp): the tail and fins sway (faster while running), the throat's core and the floats' tips
// glow with the charge, a full charge pulses.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { registerWeaponModel, GEO_KIT, getWeaponDef } from './character-weapons.js';
import { superEllipsoid, sweep } from './character-geo.js';

const { Parts, C, M, latheZ, torus, at, orient, pistolGrip, GRIP_PISTOL } = GEO_KIT;
const V3 = THREE.Vector3;

export const KY = 0.15;                       // the body's axis over the grip
const FIN = '#f6b23e', FIN_DK = '#dc8a26', LIP = '#f7958a', BELLY = '#fffaf0', CREAM = '#fbefd8', EYE_W = '#ffffff', EYE_K = '#15121c';
// the koi's side profile and plan: [z, half height, half width]
const PROF = [[-0.37, 0.028, 0.019], [-0.31, 0.038, 0.025], [-0.22, 0.06, 0.04], [-0.08, 0.09, 0.064], [0.08, 0.108, 0.079], [0.24, 0.105, 0.078],
  [0.38, 0.09, 0.07], [0.48, 0.072, 0.061], [0.555, 0.054, 0.052], [0.6, 0.047, 0.047]];
const Z0 = PROF[0][0], Z1 = PROF[PROF.length - 1][0];
const _cr = (p0, p1, p2, p3, t) => 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
function prof(z) {
  z = Math.min(Z1, Math.max(Z0, z));
  let i = 0;
  while (i < PROF.length - 2 && PROF[i + 1][0] < z) i++;
  const a = PROF[Math.max(0, i - 1)], b = PROF[i], c = PROF[i + 1], d = PROF[Math.min(PROF.length - 1, i + 2)];
  const t = (z - b[0]) / Math.max(1e-6, c[0] - b[0]);
  return { h: _cr(a[1], b[1], c[1], d[1], t), w: _cr(a[2], b[2], c[2], d[2], t), yc: KY + 0.012 * Math.sin(Math.PI * (z - Z0) / (Z1 - Z0)) };
}
// a point on the body at (z, angle a: π/2 = the back), pushed out by off along the (approximate) normal
function surf(z, a, off = 0, out = new V3()) {
  const { h, w, yc } = prof(z), s = Math.sin(a), c = Math.cos(a);
  const hy = s < 0 ? h * 0.9 : h;               // (a flatter belly)
  const nx = c / w, ny = s / hy, nl = Math.hypot(nx, ny) || 1;
  return out.set(c * w + (nx / nl) * off, yc + s * hy + (ny / nl) * off, z);
}
// an indexed grid over (z, a) → BufferGeometry, optional cell filter (a shell of the cells it keeps, own vertices)
function grid(nz, na, z0, z1, pt, keep = null) {
  const pos = [], idx = [], v = new V3();
  const W = na + 1;
  for (let i = 0; i <= nz; i++) for (let j = 0; j <= na; j++) { pt(z0 + (z1 - z0) * (i / nz), (j / na) * Math.PI * 2, v); pos.push(v.x, v.y, v.z); }
  for (let i = 0; i < nz; i++) for (let j = 0; j < na; j++) {
    if (keep && !keep(i, j)) continue;
    const a = i * W + j, b = a + 1, c = a + W, d = c + 1;
    idx.push(a, b, c, b, d, c);   // (outward: +angle × +z)
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// kohaku patches on the back (> 0 inside): a big one over the head, one across the back, one by the tail, a fleck
const BLOBS = [[0.44, 1.75, 0.11, 1.05], [0.15, 1.15, 0.17, 1.35], [0.05, 2.15, 0.12, 1.1], [-0.19, 1.85, 0.11, 1.15], [0.3, 0.2, 0.05, 0.4], [-0.05, 3.3, 0.05, 0.35]];
function patch(z, a) {
  let p = -1;
  for (const [zc, ac, rz, ra] of BLOBS) {
    let da = a - ac; da = Math.atan2(Math.sin(da), Math.cos(da));
    const wob = 0.12 * Math.sin(z * 37 + ac * 3) + 0.09 * Math.sin(a * 5 + zc * 11);
    p = Math.max(p, 1 - ((z - zc) / rz) ** 2 - (da / ra) ** 2 + wob);
  }
  return p;
}
// a flat fin from a shape (u: along, v: across), extruded thin with rounded edges, standing in the plane x = 0
function finGeo(shape, depth = 0.006) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2, curveSegments: 10 });
  g.translate(0, 0, -depth / 2);
  g.deleteAttribute('uv');
  return g;
}
function part(P, pivot, mat = 'body', lamp = null) { return { src: P.build(), pivot: pivot.clone(), mat, lamp }; }

// the fish is authored at 1.0 m and then set 0.92× and 0.14 m forward on the grip (the pistol grip stays where the hand
// is): its tail then ends where the Zooka's venturi does, clear of the over-the-shoulder camera
const FIT = new THREE.Matrix4().makeTranslation(0, 0.0, 0.14).multiply(new THREE.Matrix4().makeScale(0.92, 0.92, 0.92));
function buildKarp() {
  const P = new Parts(), I = new Parts(), TAIL = new Parts(), FL = new Parts(), FR = new Parts(), CORE = new Parts(), TIPS = new Parts(), PG = new Parts();
  pistolGrip(PG);
  // ---- the body (cream-white, a paler belly band), closed at the tail end; the lips close the front
  const body = grid(56, 40, Z0, Z1, (z, a, v) => surf(z, a, 0, v));
  P.add(body, CREAM, M.satin);
  P.add(grid(30, 14, -0.24, 0.5, (z, a, v) => surf(z, -Math.PI * 0.82 + a / (Math.PI * 2) * Math.PI * 0.64, 0.0012, v)), BELLY, M.satin);
  P.add(at(superEllipsoid(0.02, 0.029, 0.012, 0.8, 0.8, 10, 8), 0, prof(Z0).yc, Z0), CREAM, M.gloss);
  // ---- the scales: team-ink kohaku patches (a shell that sinks under the skin at its edges: a soft, ragged outline)
  {
    const nz = 72, na = 56, PV = [];
    for (let i = 0; i <= nz; i++) { PV.push([]); for (let j = 0; j <= na; j++) PV[i].push(patch(Z0 + (Z1 - Z0) * (i / nz), (j / na) * Math.PI * 2)); }
    const g = grid(nz, na, Z0, Z1, (z, a, v) => { const pp = patch(z, a); return surf(z, a, 0.0048 * Math.min(1, Math.max(0, pp / 0.16)) - 0.0016, v); },
      (i, j) => PV[i][j] > -0.08 || PV[i + 1][j] > -0.08 || PV[i][j + 1] > -0.08 || PV[i + 1][j + 1] > -0.08);
    I.add(g, '#ffffff', M.satin);
    // scale rims inside the patches: shallow overlapping arcs, rows offset like real scales
    for (let r = 0; r < 9; r++) for (let k = -5; k <= 5; k++) {
      const z = 0.5 - r * 0.075, a = Math.PI / 2 + (k + (r % 2) * 0.5) * 0.24;
      if (z < -0.28 || patch(z, a) < 0.25) continue;
      const p = surf(z, a, 0.0032), n = surf(z, a, 1).sub(surf(z, a, 0)).normalize();
      const sc = superEllipsoid(0.016, 0.0013, 0.013, 0.7, 0.7, 10, 4, (q) => { q.y += 4 * q.z * q.z + 2.5 * q.x * q.x - 0.0008; });
      I.add(orient(sc, n, p), '#ffffff', M.gloss);
    }
  }
  // ---- the float-scales: six fishing floats down the back, team ink over white, a dark band, an antenna with a tip
  for (let k = 0; k < 6; k++) {
    const z = 0.3 - k * 0.088, r = 0.034 - k * 0.0024, top = surf(z, Math.PI / 2, 0);
    const n = surf(z + 0.01, Math.PI / 2, 0).sub(surf(z - 0.01, Math.PI / 2, 0)); const up = new V3(0, n.z, -n.y).normalize();   // (the back's normal)
    if (up.y < 0) up.negate();
    const c = top.clone().addScaledVector(up, r * 0.55);
    const q = new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), up);
    const half = (sgn) => { const g = superEllipsoid(r, r * 0.95, r, 0.85, 1, 18, 12, (v) => { if (v.y * sgn < 0) v.y = 0; }); g.applyQuaternion(q); return at(g, c.x, c.y, c.z); };
    I.add(half(1), '#ffffff', M.gloss);
    P.add(half(-1), EYE_W, M.gloss);
    const band = torus(r * 1.005, 0.0032, 5, 22); band.rotateX(Math.PI / 2); band.applyQuaternion(q); P.add(at(band, c.x, c.y, c.z), C.darker, M.satin);
    const stemTop = c.clone().addScaledVector(up, r * 0.95 + 0.03 - k * 0.002);
    P.add(sweep([c.clone().addScaledVector(up, r * 0.8), stemTop], { seg: 3, radial: 6, capSteps: 1, radius: () => 0.0028 }).geo, C.darker, M.satin);
    TIPS.add(at(superEllipsoid(0.0062, 0.0075, 0.0062, 1, 1, 8, 6), stemTop.x, stemTop.y, stemTop.z), '#ffffff', M.gloss);
  }
  // ---- the mouth (the muzzle): coral lips round an open throat, an ink core deep inside it
  const zm = Z1, ym = prof(zm).yc;
  P.add(at(torus(0.043, 0.0135, 8, 28), 0, ym, zm + 0.004), LIP, M.gloss);
  P.add(latheZ([[0.044, zm + 0.004], [0.04, zm - 0.012], [0.03, zm - 0.04], [0.016, zm - 0.066], [0, zm - 0.072]], 24).translate(0, ym, 0), C.darker, M.satin);
  CORE.add(at(superEllipsoid(0.021, 0.021, 0.016, 1, 1, 14, 10), 0, ym, zm - 0.052), '#ffffff', M.gloss);
  // barbels: two whiskers curling down from the corners of the mouth
  for (const s of [1, -1]) {
    const pts = [new V3(s * 0.04, ym - 0.022, zm - 0.012), new V3(s * 0.058, ym - 0.045, zm + 0.006), new V3(s * 0.062, ym - 0.075, zm - 0.004), new V3(s * 0.055, ym - 0.092, zm - 0.022)];
    P.add(sweep(pts, { seg: 12, radial: 6, capSteps: 2, radius: (t) => 0.0052 * (1 - 0.6 * t) }).geo, FIN, M.gloss);
  }
  // ---- the eyes: big glossy cartoon eyes, a gill line behind each
  for (const s of [1, -1]) {
    const a = s > 0 ? 0.32 : Math.PI - 0.32, ze = 0.462, p = surf(ze, a, -0.004), n = surf(ze, a, 1).sub(surf(ze, a, 0)).normalize();
    // ([karp-face] the eyes a third bigger than the first cut: at play distance they read as the carp's face)
    P.add(orient(superEllipsoid(0.04, 0.016, 0.04, 0.9, 1, 18, 10), n, p), EYE_W, M.gloss);
    const pk = p.clone().addScaledVector(n, 0.012).add(new V3(0, 0.005, 0.008));
    P.add(orient(superEllipsoid(0.022, 0.0075, 0.0235, 0.9, 1, 14, 8), n, pk), EYE_K, M.gloss);
    P.add(orient(superEllipsoid(0.007, 0.0025, 0.007, 1, 1, 8, 5), n, pk.clone().addScaledVector(n, 0.0055).add(new V3(0, 0.0085, 0.005))), EYE_W, M.led);
    const gill = [];
    for (let i = 0; i <= 10; i++) { const aa = s > 0 ? -0.75 + i * 0.16 : Math.PI + 0.75 - i * 0.16; gill.push(surf(0.405 - 0.012 * Math.sin(i / 10 * Math.PI), aa, 0.0016)); }
    P.add(sweep(gill, { seg: 20, radial: 5, capSteps: 2, radius: (t) => 0.0034 * Math.sin(Math.PI * Math.min(1, Math.max(0.08, t))) }).geo, '#d8c6a6', M.satin);
  }
  // ---- the tail fin (a forked koi tail, the shoulder end: it flaps) with its rays
  const yt = prof(Z0).yc;
  {
    const S = new THREE.Shape();
    S.moveTo(0, 0.026); S.quadraticCurveTo(0.07, 0.06, 0.165, 0.145); S.quadraticCurveTo(0.15, 0.06, 0.11, 0.0); S.quadraticCurveTo(0.15, -0.06, 0.165, -0.14); S.quadraticCurveTo(0.07, -0.058, 0, -0.026); S.closePath();
    const g = finGeo(S, 0.006); g.rotateY(Math.PI / 2); TAIL.add(at(g, 0, yt, Z0 + 0.02), FIN, M.gloss);
    for (const k of [-0.9, -0.45, 0, 0.45, 0.9]) {
      const tip = new V3(0, yt + k * 0.13, Z0 + 0.02 - (0.15 - Math.abs(k) * 0.01 - (Math.abs(k) < 0.1 ? 0.04 : 0)));
      TAIL.add(sweep([new V3(0, yt + k * 0.02, Z0 + 0.01), new V3(0, yt + k * 0.07, Z0 - 0.05), tip], { seg: 8, radial: 5, capSteps: 1, radius: (t) => 0.0045 * (1 - 0.7 * t), flat: 0.6, outward: (_p, o) => o.set(1, 0, 0) }).geo, FIN_DK, M.satin);
    }
  }
  // ---- small fins: pectorals (flanking the foregrip, they sway), pelvics, the anal fin, a short dorsal behind the floats
  const finShape = (L, Wd) => { const S = new THREE.Shape(); S.moveTo(0, 0); S.quadraticCurveTo(L * 0.4, Wd, L, Wd * 0.55); S.quadraticCurveTo(L * 0.75, -Wd * 0.15, 0, -Wd * 0.25); S.closePath(); return S; };
  for (const s of [1, -1]) {
    const g = finGeo(finShape(0.11, 0.05), 0.005); g.rotateY(Math.PI / 2); g.rotateX(0.5); g.rotateZ(s * 0.55);
    const p = surf(0.33, s > 0 ? -0.55 : Math.PI + 0.55, -0.004);
    (s > 0 ? FL : FR).add(at(g, p.x, p.y, p.z), FIN, M.gloss);
    const pg = finGeo(finShape(0.07, 0.03), 0.004); pg.rotateY(Math.PI / 2); pg.rotateX(0.35); pg.rotateZ(s * 0.35);
    const pp = surf(0.02, s > 0 ? -1.15 : Math.PI + 1.15, -0.004); P.add(at(pg, pp.x, pp.y, pp.z), FIN, M.gloss);
  }
  { const g = finGeo(finShape(0.07, 0.035), 0.004); g.rotateY(Math.PI / 2); g.rotateX(0.6); const p = surf(-0.2, -Math.PI / 2, -0.004); P.add(at(g, p.x, p.y, p.z), FIN, M.gloss); }
  { const g = finGeo(finShape(0.1, 0.045), 0.005); g.rotateY(Math.PI / 2); g.rotateX(-0.42 + Math.PI); const p = surf(-0.21, Math.PI / 2, -0.006); P.add(at(g, p.x, p.y, p.z), FIN, M.gloss); }
  // ---- the hardware: a dark saddle over the grip, a rubber shoulder pad, the foregrip for the left hand
  const yb0 = prof(0.0).yc - prof(0.0).h * 0.9;
  P.add(at(superEllipsoid(0.03, 0.022, 0.085, 0.45, 0.55, 12, 6), 0, Math.min(0.055, yb0 + 0.006), 0.01), C.dark, M.satin);
  P.add(at(torus(0.034, 0.0045, 5, 20), 0, 0, 0).rotateX(Math.PI / 2).translate(0, yb0 + 0.004, 0.07), C.metal, M.metal);
  const yb1 = prof(-0.14).yc - prof(-0.14).h * 0.9;
  P.add(at(superEllipsoid(0.04, 0.014, 0.07, 0.45, 0.5, 12, 6, (q) => { q.y -= 8 * q.x * q.x; }), 0, yb1 - 0.006, -0.14), C.rubber, M.rubber);
  const yf = prof(0.3).yc - prof(0.3).h * 0.9;
  const fg = superEllipsoid(0.012, 0.036, 0.0135, 0.55, 0.65, 10, 10); fg.rotateX(-0.12);
  P.add(at(fg, 0, yf - 0.03, 0.29), C.rubber, M.rubber);
  P.add(at(superEllipsoid(0.017, 0.008, 0.026, 0.5, 0.6, 8, 5), 0, yf - 0.002, 0.29), C.dark, M.satin);
  const fit = (g) => (g ? g.applyMatrix4(FIT) : g), fitP = (v) => v.applyMatrix4(FIT);
  const parts = {
    tail: part(TAIL, new V3(0, yt, Z0 + 0.02)), finL: part(FL, surf(0.33, -0.55, -0.004)), finR: part(FR, surf(0.33, Math.PI + 0.55, -0.004)),
    core: part(CORE, new V3(0, ym, zm - 0.052), 'lamp', { color: '#1b1e25', emissive: '#ffffff', intensity: 0.4, roughness: 0.25 }),
    tips: part(TIPS, new V3(0, KY, 0), 'lamp', { color: '#1b1e25', emissive: '#ffffff', intensity: 0.3, roughness: 0.3 }),
  };
  for (const k in parts) { fit(parts[k].src); fitP(parts[k].pivot); }
  const bodyG = fit(P.build()), grip = PG.build();
  return {
    kind: 'sp_karp', body: grip ? mergeGeometries([bodyG, grip], false) : bodyG, ink: fit(I.build()),
    parts,
    muzzle: fitP(new V3(0, ym, zm + 0.03)),
    gripR: GRIP_PISTOL,
    gripL: { pos: fitP(new V3(0, yf - 0.03, 0.29)), handZ: new V3(0, 1, -0.12), handY: new V3(0.45, -0.05, -1) },
    twirl: new V3(0, 0.03, 0.03),
  };
}

// ---- part animation: the tail and fins sway (faster on the move), the core and the float tips glow with the charge
const _white = new THREE.Color(1, 1, 1), _c = new THREE.Color();
function animateKarp(w, st) {
  const P = w.parts, t = st.t || 0, dt = Math.min(0.1, Math.max(0, st.dt || 0));
  const s = w.karp || (w.karp = { ph: Math.random() * 6, glow: 0.4 });
  const sp = Math.min(1, (st.groundSpeed || 0) / 5);
  s.ph += dt * (4 + 7 * sp);
  if (P.tail) P.tail.rotation.y = Math.sin(s.ph) * (0.12 + 0.16 * sp);
  if (P.finL) P.finL.rotation.y = 0.12 * Math.sin(s.ph * 0.8 + 1);
  if (P.finR) P.finR.rotation.y = -0.12 * Math.sin(s.ph * 0.8 + 1);
  const c = Math.max(0, Math.min(1, st.charge || 0)), charging = !!(st.runner && (st.runner.charging || st.runner.charge > 0.01)) || c > 0.01;
  const full = c >= 0.995;
  const want = 0.35 + (charging ? 0.8 + 3.2 * c : 0) + (full ? 1.6 + 1.2 * Math.sin(t * 28) : 0) + 5 * (st.chargeFlash || 0);
  s.glow += (want - s.glow) * (1 - Math.exp(-dt * 16));
  const col = st.color || _white;
  for (const k of ['core', 'tips']) {
    const m = P[k]?.userData?.mesh?.material;
    if (!m) continue;
    m.color.copy(col).multiplyScalar(0.5); m.emissive.copy(col); m.emissiveIntensity = k === 'core' ? s.glow : 0.3 + (s.glow - 0.35) * 0.45;
  }
  void _c;
}
registerWeaponModel('sp_karp', buildKarp, animateKarp);

// ---- the resting Bazookarp in the world (bazookarpFx: the Pond, a drop spot, the reset comet): the same carp, all
// white-gold (its scales gold while nobody holds it), a soft glow. One group per call; dispose its materials when done.
export function karpRestMesh() {
  const d = getWeaponDef('sp_karp');
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.34, metalness: 0.05, emissive: '#3a2a08', emissiveIntensity: 0.25 });
  const ink = new THREE.MeshStandardMaterial({ color: '#ffcf5a', roughness: 0.28, metalness: 0.35, emissive: '#ffb020', emissiveIntensity: 0.35 });
  if (d.body) g.add(new THREE.Mesh(d.body, body));
  if (d.ink) g.add(new THREE.Mesh(d.ink, ink));
  g.userData.mats = [body, ink];
  // (centred on its body, the mouth along +Z)
  for (const c of g.children) c.position.set(0, -KY * 0.92, -0.25);
  return g;
}
