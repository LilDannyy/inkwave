// Scrap Sentry (kit sub 'sentry') — see kits/registry.js and tools/botlab/jobs/batch5/subs/SPEC.md §B.
// The user: "A deployable that the player can place down, and it will shoot in a turret mode. It shoots with its
// Splattershot-like weapon. The weapon is made from recycled materials."
//
// A turret built from beach junk (a rusty tin can on three bent-rod legs with red bottle-cap feet, a squeezy detergent
// bottle for a head with a copper-pipe barrel, duct tape, a bottle-cap lamp, a coat-hanger antenna). Set it down
// (release the sub): it goes 0.9 m ahead of your feet along your aim, else at your feet, on open level ground only — never
// on a roof, rail or perch, in water or lava, in a stage's no-place disc, against a wall, within spawnBarrier + 4 m of the
// enemy pad or 4 m of a teammate's sentry (your own older one is folded up: one each). It unfolds (0.6 s, shootable, not
// firing), then for its 15 s life watches all round out to 11 m by the bots' sight rules (no wall-hacks: botSight's
// shared ray budget; a still squid in its ink only within 2 m, a swimmer's ripples after 0.45 s), locks onto the
// nearest foe it can hurt (0.4 s: the lamp blinks, "bip-bip", a faint aim line) and fires bursts of 3 Spritzer-style
// rounds (22 each, 0.11 s apart, 0.5 s between bursts) at their current chest, the drop solved, no lead. It never
// targets anyone within spawnBarrier + 1 m of their own pad, nor the untouchable (botSpecials.immunity). Enemy fire of
// every kind wears down its 120 hp (wave 1's device rules, src/game/deployables.js); its owner splatted, it folds.
//
// ONLINE (docs/NET.md "Kit weapons and subs"): the owner simulates (sight, lock, fire: its rounds are ordinary recorded
// projectiles); every other screen replays a ghost from the records ['k', nid, 'sentry', …]:
//   [0, gid, x, y, z, nx, ny, nz, yaw]   set down (the ghost unfolds there)
//   [4, gid, x, y, z (, tag, lx, ly, lz, nx, ny, nz)]   wave 1's word on where it sits (a moving block: deployables netOn)
//   [3, gid, nid | -1]                   locked onto / lost (the ghost turns its head to that actor and plays the tell)
//   [6, gid, yaw, pitch]                 a burst starts (3 muzzle flashes and pfts, 0.11 s apart)
//   [5, gid, hp]                         its hp after hits (the damaged look everywhere)
//   [2, gid, why]                        gone: 0 timed out, 1 shot down, 2 crushed (tower, mover, shell, era flip, lava),
//                                        3 folded (owner splatted, replaced, carried too near the enemy spawn)
// A hit on a ghost goes to its owner (netHurt, with the attacker); a ghost shot never hurts a real one (netMuted).
//
// Events: 'sub:use' { actor, kind, pos }, 'sub:land' { kind, pos, team, radius: 0 } (unfolded), 'sentry:lock' { obj,
// target, team, pos }, 'sentry:fire' { obj, owner, team, pos, dir }, 'device:hit' / 'device:down' (wave 1's),
// 'sub:destroyed' { kind, pos, team }, 'sub:end' { kind, why, team, pos }, 'sub:note' { actor, kind, text } ("SENTRY DOWN").
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { G, emit, on, clamp, lerp, angleDiff } from '../../core/ctx.js';
import { PLAYER, SUBS, subViewScale } from '../../config.js';
import { SUB_KITS, netRec, netId, netHurt, netMuted, ghostMute } from './registry.js';
import { registerSubModel, GEO_KIT } from '../character-weapons.js';
import { lathe, superEllipsoid, sweep } from '../character-geo.js';
import { getPlasticMaterial, getInkMaterial } from '../character-mats.js';
import { Physics, Hit } from '../physics.js';
import { SUB_ICONS } from '../../ui/ui-icons.js';
import { sightRay, SIGHT } from '../botSight.js';
import { immunity } from '../botSpecials.js';
import { revealedTo } from '../reveal.js';
import { rayCapsule, DEPLOY_STATS } from '../deployables.js';
import '../../audio/sfx-sentry.js';

const KIND = 'sentry';
const { Parts, C, M, at, orient, latheZ, screw, decal, placeXY, squidShape } = GEO_KIT;
const V3 = THREE.Vector3;
const UP = new V3(0, 1, 0), DOWN = new V3(0, -1, 0), ZERO = new V3();
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const r2 = (x) => Math.round(x * 100) / 100, r3 = (x) => Math.round(x * 1000) / 1000;
const _v = new V3(), _v2 = new V3(), _v3 = new V3(), _d = new V3(), _m = new V3(), _e = new V3(), _q = new THREE.Quaternion(), _eu = new THREE.Euler();
const _hit = new Hit(), _hit2 = new Hit(), _res = { t: 0, dist: 0 }, _sph = [];
const RUST = '#b4623a', RUST_DK = '#7f3d22', TEAL = '#5fb3a8', COPPER = '#c8793e', TAPE = '#9aa0a6', PLATE = '#d9d2c0', CARD = '#c49a6c', CAP = '#e23a2e';
// prop space (hand scale): origin at the bottom centre between the feet, +Y up, +Z forward (the barrel)
const HUB0 = 0.056, HUB1 = 0.112, HUB_R = 0.03, NECK1 = 0.124, HEAD_Y = 0.142;
const LEG_R = 0.025, LEG_Y = 0.064, LEG_AZ = [Math.PI / 3, Math.PI, -Math.PI / 3];   // two front-sides, one back
const KNEE = new V3(0, -0.03, 0.026), FOOT = new V3(0, -0.058, 0.045);   // a leg in its own frame (out = +Z): 35° splayed
const FOLD = 0.66;                // rad: a leg folded down along the can (about its pivot's tangent)
const WIN_Y0 = -0.0095, WIN_H = 0.019, WIN_X = 0.0187, WIN_Z = -0.008;   // the head's clear windows (ink gauge), head-local
const WS = 2.5;                   // hand-scale model → world: built ~0.48 m tall ([sub-view] drawn × SUB_VIEW_SCALE.sentry)
const MUZ = 0.3;                  // m: the muzzle out from the head's pivot (gameplay; the pivot sits at muzzleH)
const LOOK_EVERY = 0.2, RECHECK = 0.1, LOST_KEEP = 0.6, RENEW = 1.5;   // s / s / s / m (SPEC B1.3–B1.5)
const near = (p, r = 40) => { const c = G.rig?.gameCam || G.camera; return !!c && c.position.distanceToSquared(p) < r * r; };
const enemyPad = (team) => G.level.spawnPads[1 - team];
const padDist = (p, pad) => Math.hypot(p.x - pad.x, p.z - pad.z);

// ================================================================================================= the model
// crimped bottle cap (21 crimps round its skirt): r its radius, h its height, built from y 0 up
function capGeo(r, h, crimps = 21) {
  return lathe([[0, 0], [r * 0.94, 0], [r, h * 0.12], [r, h * 0.62], [r * 0.82, h * 0.96], [0, h]], crimps * 2, (v) => {
    const rr = Math.hypot(v.x, v.z);
    if (rr < r * 0.85 || v.y > h * 0.8) return;
    const k = 1 + 0.07 * Math.cos(Math.atan2(v.z, v.x) * crimps);
    v.x *= k; v.z *= k;
  });
}
// a straight rod from a to b (radius r)
function rod(a, b, r = 0.0032) {
  const d = _d.copy(b).sub(a), len = d.length();
  return orient(superEllipsoid(r, len / 2 + r * 0.6, r, 1, 1, 7, 4), d.clone(), a.clone().addScaledVector(d, 0.5));
}
// one leg, in its own frame: pivot at the origin, out along +Z — a bent rod (hub → knee → foot) on a red bottle cap
function legParts() {
  const P = new Parts(), O = new V3();
  P.add(rod(O, KNEE), C.gunmetal, M.metal);
  P.add(rod(KNEE, FOOT), C.gunmetal, M.metal);
  P.add(at(superEllipsoid(0.0042, 0.0042, 0.0042, 1, 1, 8, 6), KNEE.x, KNEE.y, KNEE.z), C.gunmetal, M.metal);   // the bend
  P.add(at(capGeo(0.0088, 0.0066), FOOT.x, FOOT.y - 0.006, FOOT.z), CAP, M.gloss);                             // bottle-cap foot
  P.add(at(superEllipsoid(0.0045, 0.0045, 0.0045, 1, 1, 8, 6), 0, 0, 0), C.metal, M.metal);                    // its bolt
  return P;
}
// the hub: a rusty corrugated tin can, its lid peeled half off, three mismatched screws, a dented scrap plate with a
// team-ink squid stencil; the swivel neck on top
function hubParts() {
  const P = new Parts(), I = new Parts();
  const prof = [[0, HUB0], [HUB_R * 0.92, HUB0], [HUB_R, HUB0 + 0.003]];
  for (let y = HUB0 + 0.006, k = 0; y < HUB1 - 0.005; y += 0.0055, k++) prof.push([HUB_R + (k % 2 ? 0.0012 : -0.0002), y]);
  prof.push([HUB_R, HUB1 - 0.002], [HUB_R * 0.93, HUB1], [0, HUB1]);
  P.add(lathe(prof, 28, (v) => { const a = Math.atan2(v.z, v.x); if (a > 0.4 && a < 1.3 && v.y > 0.07 && v.y < 0.09) { v.x *= 0.95; v.z *= 0.95; } }), RUST, M.satin);   // (a dent)
  // rust blooms
  for (const [az, y, s] of [[2.1, 0.07, 1], [3.6, 0.095, 0.8], [5.0, 0.065, 1.2], [0.4, 0.103, 0.7]]) {
    const n = new V3(Math.sin(az), 0, Math.cos(az));
    P.add(orient(superEllipsoid(0.008 * s, 0.0006, 0.006 * s, 0.7, 0.8, 10, 4), n, n.clone().multiplyScalar(HUB_R + 0.0008).setY(y)), RUST_DK, M.satin);
  }
  // the lid, peeled half back (hinged on the left rim, bent up and out), its cut edge ragged
  {
    const lid = lathe([[0, 0], [0.026, 0], [0.026, 0.0012], [0, 0.0012]], 18, (v) => { const a = Math.atan2(v.z, v.x); const rr = Math.hypot(v.x, v.z); if (rr > 0.02) { const k = 1 + 0.06 * Math.sin(a * 7) * Math.sin(a * 3); v.x *= k; v.z *= k; } });
    lid.translate(0.026, 0, 0); lid.rotateZ(0.55); lid.translate(-0.026, HUB1 + 0.0005, 0);
    P.add(lid, C.metal, M.metal);
  }
  P.add(lathe([[0, HUB1], [0.0105, HUB1], [0.011, HUB1 + 0.002], [0.0088, HUB1 + 0.003], [0.0088, NECK1 - 0.002], [0.0105, NECK1 - 0.001], [0.0105, NECK1], [0, NECK1]], 14), C.dark, M.gloss);   // the swivel
  // the scrap plate on its front (a dented flattened lozenge) + the squid stencil in team ink
  const pn = new V3(0, 0.12, 1).normalize(), pc = new V3(0.002, 0.084, HUB_R + 0.0028);
  P.add(orient(superEllipsoid(0.0175, 0.0024, 0.016, 0.45, 0.5, 14, 6, (v) => { v.y += 0.0008 * Math.sin(v.x * 300) * Math.cos(v.z * 260); }), pn, pc), PLATE, M.satin);
  const sq = decal(squidShape(0.019), 0.0005);
  placeXY(sq, new V3(1, 0, 0), new V3(0, 1, -0.12), pc.clone().addScaledVector(pn, 0.0026).add(new V3(0, -0.009, 0)));
  I.add(sq);
  screw(P, pc.clone().add(new V3(-0.013, 0.011, 0.0018)), pn, 0.0026, C.metal);
  screw(P, pc.clone().add(new V3(0.014, -0.01, 0.0018)), pn, 0.0021, '#c9a24a');                                 // (a brass one)
  { const az = 2.5, n = new V3(Math.sin(az), 0, Math.cos(az)); screw(P, n.clone().multiplyScalar(HUB_R + 0.001).setY(0.1), n, 0.0029, C.gunmetal); }
  return { P, I };
}
// the head, in its own frame (pivot at the origin, the barrel along +Z): a squeezy detergent bottle on its side, its
// spout lengthened with a copper pipe and a rubber muzzle, two duct-tape bands strapping it to the swivel, clear windows
// on its flanks (the team-ink gauge: a separate mesh), a bottle-cap lamp on top (separate), a coat-hanger antenna at its
// back with a rubber-hose grip and a cardboard tag
const BOTTLE = [[0, -0.044], [0.011, -0.0436], [0.0185, -0.0405], [0.0215, -0.034], [0.0222, -0.012], [0.0218, 0.014], [0.0195, 0.025], [0.0138, 0.0335], [0.0088, 0.0385], [0.0078, 0.0418], [0, 0.0424]];
const FLAT = 0.84;   // the bottle's cross-section, squashed in x
function headParts() {
  const P = new Parts();
  P.add(latheZ(BOTTLE, 26).scale(FLAT, 1, 1), TEAL, M.gloss);
  P.add(latheZ([[0, 0.0412], [0.0074, 0.0412], [0.0071, 0.0468], [0.0052, 0.0488], [0, 0.049]], 14), C.cream, M.satin);   // the spout cap
  P.add(latheZ([[0, 0.046], [0.0054, 0.046], [0.0054, 0.0735], [0, 0.0735]], 12), COPPER, M.metal);                          // the copper pipe
  P.add(latheZ([[0, 0.0466], [0.0066, 0.0466], [0.0066, 0.0502], [0, 0.0502]], 12), COPPER, M.metal);                         // its joint
  P.add(latheZ([[0, 0.0728], [0.0074, 0.0728], [0.0078, 0.0745], [0.0078, 0.0792], [0.006, 0.0805], [0, 0.0805]], 14), C.rubber, M.rubber);   // the muzzle
  // duct tape: two faceted bands round the bottle, each running down to the swivel
  for (const z of [-0.022, 0.006]) {
    P.add(latheZ([[0.0221, z - 0.0034], [0.0229, z - 0.0029], [0.0229, z + 0.0029], [0.0221, z + 0.0034]], 9).scale(FLAT * 1.01, 1.01, 1).rotateZ(z * 4), TAPE, M.satin);
    P.add(at(superEllipsoid(0.0062, 0.006, 0.0032, 0.35, 0.4, 8, 6), 0, -0.0225, z), TAPE, M.satin);
  }
  // the windows' dark backing (the team-ink gauge sits on it)
  for (const s of [1, -1]) P.add(at(superEllipsoid(0.0011, WIN_H * 0.56, 0.0168, 0.3, 0.3, 6, 6), s * (WIN_X - 0.0009), WIN_Y0 + WIN_H * 0.5, WIN_Z), C.lens, M.lens);
  P.add(at(capGeo(0.0078, 0.0042, 18), 0, 0.0198, -0.006), C.white, M.satin);   // the lamp's bottle cap
  // the coat-hanger antenna: a bent wire loop off its back, a bit of rubber hose on it (the grip), a cardboard tag
  const wire = [new V3(0.004, 0.016, -0.034), new V3(0.004, 0.03, -0.046), new V3(0.003, 0.05, -0.05), new V3(0.0, 0.064, -0.045), new V3(-0.003, 0.072, -0.033), new V3(-0.005, 0.07, -0.022), new V3(-0.004, 0.064, -0.02)];
  P.add(sweep(wire, { seg: 22, radial: 6, capSteps: 1, radius: () => 0.0016 }).geo, C.metal, M.metal);
  P.add(at(lathe([[0, 0.034], [0.0048, 0.034], [0.005, 0.036], [0.005, 0.058], [0.0048, 0.06], [0, 0.06]], 12), 0.0034, 0, -0.0488), C.rubber, M.rubber);
  const tag = superEllipsoid(0.0011, 0.0095, 0.0115, 0.25, 0.25, 6, 6); tag.rotateY(0.25); tag.rotateX(0.18);
  P.add(at(tag, 0.0075, 0.04, -0.06), CARD, M.satin);
  const doodle = decal(squidShape(0.011), 0.0004);
  placeXY(doodle, new V3(0, 0, -1).applyAxisAngle(UP, 0.25), new V3(0, 1, 0.18), new V3(0.0088, 0.035, -0.06));
  P.add(doodle, C.dark, M.print);
  return P;
}
// the two window gauges, from their bottom (y 0) up WIN_H: scaled in y by how much ink is left
function windowInkGeo() {
  const I = new Parts();
  for (const s of [1, -1]) I.add(at(superEllipsoid(0.0012, WIN_H * 0.5, 0.0152, 0.3, 0.3, 6, 6), s * WIN_X, WIN_H * 0.5, WIN_Z));
  return I.build();
}
const lampGeo = () => superEllipsoid(0.0054, 0.0042, 0.0054, 1, 1, 12, 8).translate(0, 0.0255, -0.006);
const LEG_AT = LEG_AZ.map((az) => new V3(Math.sin(az) * LEG_R, LEG_Y, Math.cos(az) * LEG_R));
const legMatrix = (k, fold) => new THREE.Matrix4().makeTranslation(LEG_AT[k].x, LEG_AT[k].y, LEG_AT[k].z).multiply(new THREE.Matrix4().makeRotationY(LEG_AZ[k])).multiply(new THREE.Matrix4().makeRotationX(fold));

// the hand prop (registerSubModel): legs folded along the can, the head forward, the antenna's hose the grip
registerSubModel(KIND, () => {
  const H = hubParts(), head = headParts().build().translate(0, HEAD_Y, 0), leg = legParts().build();
  const body = mergeGeometries([H.P.build(), head, ...LEG_AZ.map((_, k) => leg.clone().applyMatrix4(legMatrix(k, FOLD + 0.12))), lampGeo().translate(0, HEAD_Y, 0)].map(addMat), false);
  const ink = mergeGeometries([H.I.build(), windowInkGeo().translate(0, HEAD_Y + WIN_Y0, 0)].map(addMat), false);
  return { kind: KIND, body, ink, grip: { pos: new V3(0.0034, HEAD_Y + 0.047, -0.0488), handZ: new V3(0, -1, 0), handY: new V3(-0.3, -0.1, -1) } };
});
// (the hand prop's lamp is part of its body: give the lamp geometry the parts' attributes)
function addMat(g) {
  if (g.attributes.aMat) return g;
  const P = new Parts(); P.add(g, '#fff6c8', M.led); return P.build();
}
let WG = null;   // the world model's geometries (built once): hub, one leg, head, window gauges, lamp
function worldGeo() {
  if (!WG) { const H = hubParts(); WG = { hub: H.P.build(), stencil: H.I.build(), leg: legParts().build(), head: headParts().build(), win: windowInkGeo(), lamp: lampGeo() }; }
  return WG;
}
// outer (at the foot, yaw = its base) → model (× WS × vs) → hub, legs[k] (pivot → fold), neck (pops up) → swivel (head
// yaw) → pitch → head, window gauges (scaled with the ink left), lamp
function makeMesh(team, vs) {
  const g = worldGeo(), col = G.teamColors[team];
  const outer = new THREE.Group(), model = new THREE.Group();
  model.scale.setScalar(WS * vs);
  const plastic = getPlasticMaterial(), ink = getInkMaterial(col);
  const hub = new THREE.Mesh(g.hub, plastic), sten = new THREE.Mesh(g.stencil, ink);
  hub.castShadow = sten.castShadow = true;
  model.add(hub, sten);
  const legs = LEG_AZ.map((az, k) => {
    const pv = new THREE.Group(); pv.position.copy(LEG_AT[k]); pv.rotation.y = az;
    const fold = new THREE.Group(); fold.rotation.x = FOLD;
    const m = new THREE.Mesh(g.leg, plastic); m.castShadow = true;
    fold.add(m); pv.add(fold); model.add(pv);
    return fold;
  });
  const neck = new THREE.Group(); neck.position.y = NECK1;
  const swivel = new THREE.Group(); swivel.position.y = HEAD_Y - NECK1;
  const pitch = new THREE.Group();
  const head = new THREE.Mesh(g.head, plastic); head.castShadow = true;
  const win = new THREE.Mesh(g.win, ink); win.position.y = WIN_Y0;
  const lampMat = new THREE.MeshStandardMaterial({ color: col.clone().multiplyScalar(0.4), emissive: col.clone(), emissiveIntensity: 0.8, roughness: 0.3 });
  const lamp = new THREE.Mesh(g.lamp, lampMat);
  pitch.add(head, win, lamp); swivel.add(pitch); neck.add(swivel); model.add(neck);
  outer.add(model);
  return { outer, model, hub, sten, legs, neck, swivel, pitch, head, win, lamp, lampMat, parts: [hub, sten, head, win, legs[0].children[0], legs[1].children[0], legs[2].children[0]] };
}

// ================================================================================================= icon
// (the roster style: dark outline, light fills, team colour = currentColor) three splayed bent-rod legs on red crimped
// caps, the rusty can with its scrap plate, the teal bottle head pointing right with its copper barrel and a grey tape
// band, the cap lamp in team colour, the coat-hanger loop at its back, a small ink drop leaving the muzzle
{
  const K = '#15121c', DK = '#2b2735';
  const O = `stroke="${K}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const LEGS = 'M26 45 L17 51 L11 57 M32 46 L32 58 M38 45 L47 51 L53 57';
  SUB_ICONS[KIND] = `<svg class="iw-ico " viewBox="0 0 64 64" aria-hidden="true">
    <g fill="none" stroke="${K}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"><path d="${LEGS}"/><path d="M14 13 Q8 9 10 4 Q13 1 15 5"/></g>
    <g fill="none" stroke="#8f98a6" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="${LEGS}"/></g>
    <path d="M14 13 Q8 9 10 4 Q13 1 15 5" fill="none" stroke="#c3c9d2" stroke-width="2.2" stroke-linecap="round"/>
    <g ${O}>
      <path d="M6.5 57.5 Q6.5 54 11 54 Q15.5 54 15.5 57.5 L15.5 59.5 L6.5 59.5 Z" fill="#ff3b30"/>
      <path d="M27.5 58 Q27.5 54.5 32 54.5 Q36.5 54.5 36.5 58 L36.5 60 L27.5 60 Z" fill="#ff3b30"/>
      <path d="M48.5 57.5 Q48.5 54 53 54 Q57.5 54 57.5 57.5 L57.5 59.5 L48.5 59.5 Z" fill="#ff3b30"/>
      <path d="M21 31 L43 31 L43.5 45.5 Q32 48 20.5 45.5 Z" fill="#b4623a"/>
      <rect x="25.5" y="35" width="13" height="8.5" rx="2" fill="#d9d2c0" stroke-width="2.4"/>
      <rect x="44" y="18.5" width="12.5" height="6.5" rx="1.4" fill="#c8793e"/>
      <rect x="55.5" y="17.5" width="3.5" height="8.5" rx="1.2" fill="${DK}" stroke-width="2.2"/>
      <path d="M11 21 Q11 12 20 12 L36 12 Q44 13 46 18.5 L46 25 Q44 30 36 30 L20 30 Q11 30 11 21 Z" fill="#5fb3a8"/>
      <rect x="26" y="11" width="5.5" height="20" rx="1.4" fill="#9aa0a6" stroke-width="2.4"/>
      <circle cx="19.5" cy="7.5" r="3.8" fill="currentColor"/>
    </g>
    <path d="M15 17.5 Q17 14.5 22 14.5" stroke="#fff" stroke-opacity=".6" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M24 39 L24 39" stroke="${DK}" stroke-opacity=".5" stroke-width="2"/>
    <path d="M29 37.5 Q32 35.5 35 37.5 L34 41.5 L30 41.5 Z" fill="currentColor" opacity=".85"/>
    <path d="M22 33.5 L23 44 M41.5 33.5 L41 44" stroke="${DK}" stroke-opacity=".35" stroke-width="1.6"/>
    <path d="M62 16 Q64.5 20.5 62 23 Q59.5 20.5 62 16 Z" fill="currentColor" stroke="${K}" stroke-width="1.6" stroke-linejoin="round"/>
  </svg>`;
}

// ================================================================================================= placement
const WHY = { ground: 'Set it down on open ground', spawn: 'Too close to their spawn', spacing: 'Too close to another sentry' };
const RANK = { ground: 1, spacing: 2, spawn: 3 };
const _spot = { ok: false, why: '', point: new V3(), normal: new V3(), block: -1, a: null, t: -1, yaw: 0 };
const _cand = { point: new V3(), normal: new V3(), block: -1 };
const CLEAR_DIRS = Array.from({ length: 8 }, (_, k) => new V3(Math.sin((k / 8) * TAU), 0, Math.cos((k / 8) * TAU)));
// can a sentry stand at (x, z) for actor a? → '' (yes: _cand holds the spot) or the rule it fails ('ground' | 'spawn' |
// 'spacing'). The rules (SPEC B1.1): a floor found from 0.6 m above, 2.2 m down; level (normal.y ≥ 0.85); within 0.6 m
// of the feet (1.6 in the air); in sight of the chest; not a roof / rail / perch, water, lava (now or within 1 s), nor a
// stage module's no-place disc; 0.4 m clear of walls (and room overhead); spawnBarrier + 4 m from the enemy pad; 4 m
// from every live sentry of the team but this player's own (it is replaced)
function spotRule(a, s, x, z, air) {
  const L = G.level, P = G.physics, fy = a.pos.y;
  const g = P.raycast(_v.set(x, fy + 0.6, z), DOWN, 2.2, _hit);
  if (!g.hit || g.normal.y < 0.85 || Math.abs(g.point.y - fy) > (air ? 1.6 : 0.6)) return 'ground';
  const b = L.blocks[g.block];
  if (b && (b.roof || b.rail || b.perch)) return 'ground';
  const p = g.point;
  if (p.y < L.liquidY(p.x, p.z) + 0.02 || G.match?.stage?.under?.(p, 0)) return 'ground';
  if (G.match?.lava?.covers?.(p.x, p.z, p.y, 1)) return 'ground';
  if (L.noPlace(p, s.hitR)) return 'ground';
  if (!P.los(_v2.set(a.pos.x, fy + 1.0, a.pos.z), _v3.set(p.x, p.y + 0.3, p.z))) return 'ground';
  for (const h of [0.25, 0.6]) for (const dir of CLEAR_DIRS) {
    const w = P.raycast(_v2.set(p.x, p.y + h, p.z), dir, 0.4, _hit2, true);
    if (w.hit && Math.abs(w.normal.y) < 0.5) return 'ground';
  }
  if (P.raycast(_v2.set(p.x, p.y + 0.05, p.z), UP, s.hitH, _hit2, true).hit) return 'ground';
  if (padDist(p, enemyPad(a.team)) < (L.spawnBarrier ?? 4.2) + s.padPlace) return 'spawn';
  for (const o of items) if (o.state !== 'dead' && o.team === a.team && o.owner !== a && Math.hypot(o.pos.x - p.x, o.pos.z - p.z) < s.spacing) return 'spacing';
  _cand.point.copy(p); _cand.normal.copy(g.normal); _cand.block = g.block;
  return '';
}
// where actor a's sentry would go now (0.9 m ahead along its aim, else at its feet) → _spot { ok, why, point, … }; cached
// for the frame (blocked() then use() on the release ask twice)
// (a bot that chose its spot a moment ago — botGo — sets it down the way it chose: b._sentryAim)
const aimOf = (a) => { const A = a.bot?._sentryAim; return A && G.time - A.t < 0.5 ? A.yaw : a.aimYaw ?? a.yaw; };
function findSpot(a, s = a.sub && a.sub.kind === KIND ? a.sub : SUBS.sentry) {
  const yaw = aimOf(a);
  if (_spot.a === a && _spot.t === G.time && _spot.yaw === yaw) return _spot;
  _spot.a = a; _spot.t = G.time; _spot.yaw = yaw; _spot.ok = false; _spot.why = '';
  const air = !a.grounded;
  let worst = '';
  for (const ahead of [0.9, 0]) {
    const why = spotRule(a, s, a.pos.x + Math.sin(yaw) * ahead, a.pos.z + Math.cos(yaw) * ahead, air);
    if (!why) { _spot.ok = true; _spot.point.copy(_cand.point); _spot.normal.copy(_cand.normal); _spot.block = _cand.block; return _spot; }
    if (!worst || RANK[why] > RANK[worst]) worst = why;
  }
  _spot.why = worst;
  return _spot;
}

// ================================================================================================= the sentries
const items = [];
const fading = [];   // ended sentries still folding / crumpling on screen (visual only)
function spawn(a, sub, pos, yaw, ghost, gid, block = -1) {
  const vs = subViewScale(KIND);   // [sub-view]
  const m = makeMesh(a.team, vs);
  G.scene.add(m.outer);
  const it = { owner: a, team: a.team, sub, gid, ghost, state: 'unfold', t: 0, age: 0, hp: sub.hp, vs, m,
    pos: pos.clone(), headYaw: yaw, headPitch: 0, sweepPh: 0, target: null, lockT: 0, locked: false, seenT: -9, lostT: 0, lookT: 0, reT: 0,
    glim: new Map(), shotT: 0, burstLeft: sub.burst, burstOn: false, ghostShots: 0, ghostShotT: 0, flash: 0, flashOn: false,
    lineT: 0, fireT: 0, coughT: 0, smokeT: 0, chkT: 0, liqT: 0, hpT: -9, why: '', vis: false, floorId: block,
    lookT: ((gid % 97) / 97) * LOOK_EVERY };   // (its looks staggered by gid)
  // wave 1's ride body: deployables.js moves it on any moving floor (attach / carry / netOn / _pushes / _lost)
  const rb = it.rb = { pos: it.pos, normal: UP.clone(), mesh: new THREE.Object3D(), state: 'kit', floor: true, hover: 0, kind: KIND, team: a.team,
    ghost, gid, owner: a, netKind: KIND, on: null, ride: null, onRec: false, pendOn: null, pushRec: false, pushT: 0, obj: it,
    kill: (why) => end(it, why === 2 ? 'crush' : 'fold', null) };
  rb.mesh.position.copy(it.pos); rb.mesh.quaternion.setFromAxisAngle(UP, yaw);
  it.desc = descOf(it); it.thr = threatOf(it);
  items.push(it);
  if (block >= 0) G.deploy?.attach(rb, block);   // set down on a moving floor (the tower's deck, a pod, a railcar): it rides
  place(it);
  return it;
}
const baseYaw = (it) => _eu.setFromQuaternion(it.rb.mesh.quaternion, 'YXZ').y;
const byNid = (n) => (n >= 0 ? G.actors.find((e) => e.nid === n) || null : null);
const live = (it) => it.state === 'unfold' || it.state === 'watch';

function use(subs, a, sub) {
  const S = findSpot(a, sub);
  if (!S.ok) {   // (a caller that skipped blocked(): refuse, ink back)
    if (a.specialActive?.kind !== 'barrage') a.ink = Math.min(PLAYER.inkMax, a.ink + (sub.inkCost || 0));
    emit('sub:cantuse', { actor: a, kind: KIND, reason: WHY[S.why] || '' });
    return;
  }
  // one each: the older one folds up and pops harmlessly
  for (const o of items) if (o.owner === a && !o.ghost && live(o)) end(o, 'replaced', null);
  const yaw = aimOf(a), p = S.point, n = S.normal;
  if (a.bot) a.bot._sentryAim = null;
  const it = spawn(a, sub, p, yaw, false, netId(a), S.block);
  netRec(a, KIND, [0, it.gid, r2(p.x), r2(p.y), r2(p.z), r2(n.x), r2(n.y), r2(n.z), r2(yaw)]);
  G.cues?.sub(KIND, 'throw', { owner: a, at: p, range: 30 });   // sfx-cues: the tin clatter (cues.js SUB_CUE.sentry)
  emit('sub:use', { actor: a, kind: KIND, pos: p.clone() });
}
// the thump as it lands (both screens)
function place(it) {
  if (near(it.pos, 45)) {
    G.fx?.burst?.(_v.copy(it.pos).setY(it.pos.y + 0.05), UP, new THREE.Color(0.55, 0.5, 0.45), { count: 6, speed: 1.6, size: 0.05, sheet: false });
    G.fx?.ring?.(_v.copy(it.pos).setY(it.pos.y + 0.03), UP, G.teamColors[it.team], { radius: 0.5, life: 0.3 });
  }
}

// ---- online: a remote player's sentry (the records in the header)
function ghost(a, d) {
  if (!Array.isArray(d)) return;
  const [op, gid] = d;
  if (op === 0) {
    if (items.some((x) => x.gid === gid)) return;
    const p = new V3(d[2], d[3], d[4]);
    const g = G.physics.raycast(_v.set(p.x, p.y + 0.4, p.z), DOWN, 1.2, _hit);
    spawn(a, SUBS.sentry, p, d[8] || 0, true, gid, g.hit ? g.block : -1);
    G.cues?.sub(KIND, 'throw', { owner: a, at: p, range: 30 });
    return;
  }
  const it = items.find((x) => x.ghost && x.gid === gid && live(x));
  if (!it) return;
  if (op === 4) G.deploy?.netOn(it.rb, d);
  else if (op === 3) { const T = byNid(d[2]); if (T) startLock(it, T); else dropTarget(it); }
  else if (op === 6) { it.headYaw = d[2]; it.headPitch = d[3]; it.ghostShots = it.sub.burst; it.ghostShotT = 0; }
  else if (op === 5) it.hp = Math.min(it.hp, d[2]);
  else if (op === 2) end(it, d[2] === 1 ? 'shot' : d[2] === 2 ? 'crush' : d[2] === 3 ? 'fold' : 'time', null);
}

// ================================================================================================= per frame
function step(it, dt) {
  const s = it.sub;
  if (it.state === 'unfold') {
    if (it.t >= s.setup) { it.state = 'watch'; emit('sub:land', { kind: KIND, pos: it.pos.clone(), team: it.team, radius: 0 }); }
  }
  if (it.ghost) {
    if (it.age > s.life + 3) end(it, 'lost', null);   // (its owner's end record never came)
    ghostAim(it, dt);
    return;
  }
  // ---- the owner's: life, the spawn rule while riding, liquids, a block closing over it
  if (it.t >= s.life) return end(it, 'time', null);
  if (padDist(it.pos, enemyPad(it.team)) < (G.level.spawnBarrier ?? 4.2) + s.padPlace) return end(it, 'carried', null);
  if ((it.liqT -= dt) <= 0) {
    it.liqT = 0.25;
    if (it.pos.y < G.level.liquidY(it.pos.x, it.pos.z) - 0.05 || G.match?.stage?.under?.(it.pos, -0.05)) return downBy(it, 'lava');
  }
  if ((it.chkT -= dt) <= 0) {
    it.chkT = 0.1;
    _m.set(it.pos.x, it.pos.y + s.hitH * 0.5, it.pos.z);
    for (const b of G.level.dyn || []) if (b.solid !== false && b !== it.rb.on?.b && G.level.pointInBlock(b, _m, -0.02)) return downBy(it, 'crush');
  }
  if (it.state !== 'watch') return;
  watch(it, dt);
}

// ---- eyes (the owner's screen only): every LOOK_EVERY s (staggered by gid), nearest first, ≤ 2 sight lines a foe in
// range out of botSight's shared frame budget (null: over it — the rest of the look waits a frame)
const _cands = [];
function eyeOf(it, out) { return out.set(it.pos.x, it.pos.y + it.sub.eyeH, it.pos.z); }
function muzzleOf(it, out) {
  const cp = Math.cos(it.headPitch);
  return out.set(it.pos.x + Math.sin(it.headYaw) * cp * MUZ, it.pos.y + it.sub.muzzleH + Math.sin(it.headPitch) * MUZ, it.pos.z + Math.cos(it.headYaw) * cp * MUZ);
}
const chestY = (e) => e.pos.y + (e.form === 'squid' ? 0.3 : 0.7);
// the Bazookarp shell (G.objTargets.spheres): a segment from a to b passing within r of a solid sphere's centre
function shellBlocks(a, b) {
  const T = G.objTargets;
  if (!T || typeof T.spheres !== 'function') return false;
  _sph.length = 0; T.spheres(_sph);
  for (const S of _sph) {
    if (S.solid === false) continue;
    _d.copy(b).sub(a); const L2 = _d.lengthSq(); if (L2 < 1e-9) continue;
    const u = clamp(_v.copy(S.c).sub(a).dot(_d) / L2, 0, 1);
    if (_v.copy(a).addScaledVector(_d, u).distanceTo(S.c) < S.r) return true;
  }
  return false;
}
// a foe it may lock on at all (before any sight line): alive, not mid-jump, in range (muzzle to chest), not by its own
// pad (spawnBarrier + padTarget), hurtable from here (immunity ≥ 0.3), not behind the shell → its distance, or -1
function canTarget(it, e, mz) {
  const s = it.sub;
  if (!e || !e.alive || e.team === it.team) return -1;
  const sj = e.superJumpState;
  if ((sj && sj.phase === 'flight') || G.match?.stage?.sightLanding?.(e)) return -1;
  const cy = chestY(e), d = Math.hypot(e.pos.x - mz.x, cy - mz.y, e.pos.z - mz.z);
  if (d > s.range) return -1;
  if (padDist(e.pos, G.level.spawnPads[e.team]) < (G.level.spawnBarrier ?? 4.2) + s.padTarget) return -1;
  if (immunity(e, mz.x, mz.y, mz.z) < 0.3) return -1;
  if (shellBlocks(mz, _v3.set(e.pos.x, cy, e.pos.z))) return -1;
  return d;
}
// is e seen from eye now? (the bots' ink rules; dtc: s since the last look) → true / false / null (over budget)
function sees(it, e, eye, d, dtc) {
  const located = !!revealedTo(e, it.team);
  if (!located && e.anim && e.anim.form === 'swim') {
    const hs = Math.hypot(e.vel.x, e.vel.z), was = G.time - it.seenT < SIGHT.swimFollow && it.target === e;
    let reach, notice = 0;
    if (hs < SIGHT.stillSpeed) reach = SIGHT.stillR;
    else if (was) reach = SIGHT.swimTrackR;
    else { reach = Math.max(SIGHT.stillR, Math.min(SIGHT.swimR, (hs - SIGHT.stillSpeed) * SIGHT.swimK)); notice = reach > SIGHT.stillR ? SIGHT.swimNotice : 0; }
    if (d > reach) { it.glim.delete(e); return false; }
    const v = sightLine(eye, e);
    if (v !== true) { if (v === false) it.glim.delete(e); return v; }
    if (notice > 0) { const g = (it.glim.get(e) || 0) + dtc; it.glim.set(e, g); return g >= notice; }
    return true;
  }
  it.glim.delete(e);
  return sightLine(eye, e);
}
function sightLine(eye, e) {
  const sq = e.form === 'squid';
  const v = sightRay(eye, _v2.set(e.pos.x, e.pos.y + (sq ? 0.3 : 1.0), e.pos.z));
  if (v !== false || sq) return v;
  return sightRay(eye, _v2.set(e.pos.x, e.pos.y + 1.6, e.pos.z));
}
function look(it, dtc) {
  const eye = eyeOf(it, _e), mz = muzzleOf(it, _m);
  if (G.boss) return bossLook(it, eye, mz);
  _cands.length = 0;
  for (const e of G.actors) { const d = canTarget(it, e, mz); if (d >= 0) _cands.push(e, d); }
  // nearest first: the first one seen is the nearest seen
  let best = null, bd = Infinity, curD = -1;
  const n = _cands.length / 2, order = [];
  for (let i = 0; i < n; i++) order.push(i);
  order.sort((p, q) => _cands[p * 2 + 1] - _cands[q * 2 + 1]);
  for (const i of order) {
    const e = _cands[i * 2], d = _cands[i * 2 + 1];
    const v = sees(it, e, eye, d, dtc);
    if (v === null) return false;
    if (v) { best = e; bd = d; break; }
  }
  // its current target, if it's still in the running and farther than the nearest seen: kept unless that one is
  // RENEW m nearer
  const T = it.target && !it.target.bossT ? it.target : null;
  if (T && best && best !== T) {
    const k = _cands.indexOf(T);
    if (k >= 0 && k % 2 === 0) {
      curD = _cands[k + 1];
      if (curD - bd < RENEW) { const v = sees(it, T, eye, curD, dtc); if (v === null) return false; if (v) { best = T; bd = curD; } }
    }
  }
  _cands.length = 0;
  if (best) seen(it, best);
  else unseen(it);
  return true;
}
// Boss Battle: the nearest crablet in range and sight, else the boss's nearest hit shape it can see
function bossLook(it, eye, mz) {
  const B = G.boss, s = it.sub;
  let best = null, bd = Infinity, bp = null;
  for (const c of B.crabs?.values?.() || []) {
    if (c.dead) continue;
    const p = _v2.set(c.x, c.y + 0.35, c.z), d = p.distanceTo(mz);
    if (d > s.range || d >= bd) continue;
    const v = sightRay(eye, p); if (v === null) return false;
    if (v) { bd = d; best = c; bp = p.clone(); }
  }
  if (!best && B.visible && !B.dead) {
    for (const h of (B.model?.hitShapes || []).filter((x) => x.active).sort((p, q) => p.pos.distanceTo(mz) - q.pos.distanceTo(mz))) {
      const d = h.pos.distanceTo(mz) - h.r * 0.6;
      if (d > s.range) break;
      const v = sightRay(eye, h.pos); if (v === null) return false;
      if (v) { best = h; bp = h.pos.clone(); break; }
    }
  }
  if (!best) { unseen(it); return true; }
  const T = it.bossT || (it.bossT = { bossT: true, alive: true, pos: new V3(), vel: ZERO, form: 'kid', ref: null });
  T.ref = best; T.pos.copy(bp).y -= 0.7;   // (its "chest" is the hit point: chestY adds 0.7)
  seen(it, T);
  return true;
}
// a look found e (the nearest it can hurt): a new target takes a new lock; its target seen again keeps it
function seen(it, e) {
  if (it.target !== e) { if (it.target) dropTarget(it, true); startLock(it, e); }
  it.seenT = G.time; it.vis = true;
}
// a look found nobody: out of sight now; a target lost for LOST_KEEP s is dropped (seen again sooner: no new lock)
function unseen(it) {
  if (!it.target) return;
  it.vis = false;
  if (G.time - it.seenT >= LOST_KEEP) dropTarget(it);
}
// a new target: the lock (0.4 s) — a target lost for under LOST_KEEP s and seen again keeps its lock (seen())
function startLock(it, e) {
  const again = it.lastT === e && G.time - it.lastSeenT < LOST_KEEP && it.lastLocked;
  it.target = e; it.locked = again; it.lockT = again ? it.sub.lock : 0; it.lineT = again ? 0 : it.sub.lock; it.vis = true;
  if (!it.ghost) { it.seenT = G.time; if (!e.bossT) netRec(it.owner, KIND, [3, it.gid, e.nid ?? -1]); }
  if (again) return;
  it.burstLeft = it.sub.burst; it.shotT = 0;
  G.cues?.sub(KIND, 'warn', { owner: it.owner, team: it.team, at: it.pos, target: e.bossT ? null : e, radius: 2, range: 25, vol: G.local && e === G.local ? 1.25 : 0.85 });   // sfx-cues: "bip-bip"
  emit('sentry:lock', { obj: it, target: e.bossT ? null : e, team: it.team, pos: it.pos.clone() });
}
function dropTarget(it, swap = false) {
  if (!it.target) return;
  it.lastT = it.target; it.lastSeenT = it.seenT; it.lastLocked = it.locked;
  if (!it.ghost && !swap && !it.target.bossT) netRec(it.owner, KIND, [3, it.gid, -1]);   // (a swap: the new lock's record says it)
  it.target = null; it.locked = false; it.lockT = 0; it.lineT = 0; it.vis = false;
}

// ---- watching, locking, firing (the owner's)
const _sol = new V3();
function watch(it, dt) {
  const s = it.sub;
  // (the lock runs while its target is in sight: counted before this frame's look, so a lock started now is 0 at the end of
  // this frame and takes exactly s.lock from the frame it began)
  if (it.target && it.vis) it.lockT += dt;
  // its looks: every LOOK_EVERY s from its own phase; a deferred look tries again next frame
  it.lookT -= dt;
  if (it.lookT <= 0) {
    const dtc = Math.min(0.5, LOOK_EVERY - it.lookT);
    it.lookT = look(it, dtc) ? LOOK_EVERY : 0;   // (deferred: next frame)
  }
  // its target in sight between looks: re-checked every RECHECK s (one line to its chest), so it doesn't keep firing at
  // a wall a whole look long after they ducked behind it
  const T = it.target;
  if (T && !T.bossT && it.vis && (it.reT -= dt) <= 0) {
    it.reT = RECHECK;
    const v = T.alive ? sightLine(eyeOf(it, _e), T) : false;
    if (v === true && canTarget(it, T, muzzleOf(it, _m)) >= 0) it.seenT = G.time;
    else if (v !== null) it.vis = false;
  }
  if (T && (!T.alive || (!T.bossT && T.team === it.team))) dropTarget(it);
  const tgt = it.target, inSight = !!tgt && it.vis;
  it.shotT -= dt;
  if (tgt) {
    if (!it.locked && inSight && it.lockT >= s.lock - 1e-6) { it.locked = true; it.shotT = 0; }
    // aim: the current chest, the drop solved (the Squall Spinner's solver), no lead
    const mz = muzzleOf(it, _m), cy = tgt.bossT ? tgt.pos.y + 0.7 : chestY(tgt);
    _v3.set(tgt.pos.x, cy, tgt.pos.z);
    _sol.copy(_v3).sub(mz).normalize();
    G.projectiles?._ballistic?.(mz, _sol, _v3, s.speed, s.straight, 28, 0.8, s.range);
    const wy = Math.atan2(_sol.x, _sol.z), wp = clamp(Math.asin(clamp(_sol.y, -1, 1)), -35 * DEG, 50 * DEG);
    turnHead(it, dt, wy, wp, s.turnYaw, s.turnPitch);
    // fire: locked, in sight, the head within fireCone of the solved line
    const off = Math.hypot(angleDiff(it.headYaw, wy) * Math.cos(wp), it.headPitch - wp);
    // (an accumulator: the gaps keep their sub-frame remainder, never two rounds in a frame, nothing banked while off)
    if (it.locked && inSight && off < s.fireCone * DEG && it.shotT <= 1e-6) {
      if (it.burstLeft === s.burst) netRec(it.owner, KIND, [6, it.gid, r3(it.headYaw), r3(it.headPitch)]);
      fire(it, wy, wp);
      if (--it.burstLeft > 0) it.shotT += s.burstGap;
      else { it.burstLeft = s.burst; it.shotT += s.burstPause; }
      if (it.shotT < 0) it.shotT = 0;
    } else if (it.shotT < 0) it.shotT = 0;
  } else {
    idleSweep(it, dt);
    it.burstLeft = s.burst; it.shotT = 0;
  }
}
function turnHead(it, dt, wy, wp, ry, rp) {
  it.headYaw += clamp(angleDiff(it.headYaw, wy), -ry * dt, ry * dt);
  it.headPitch += clamp(wp - it.headPitch, -rp * dt, rp * dt);
}
// no target: the head sweeps ±45° round its facing at 40°/s, level
function idleSweep(it, dt) {
  it.sweepPh += (dt * 40 * DEG) / (4 * 45 * DEG);
  const ph = it.sweepPh % 1, tri = ph < 0.25 ? ph * 4 : ph < 0.75 ? 2 - ph * 4 : ph * 4 - 4;
  turnHead(it, dt, baseYaw(it) + tri * 45 * DEG, 0, 40 * DEG * 1.6, 1.5);
}
// a round (its owner's projectile: recorded for the other screens by the projectile system itself)
function fire(it, wy, wp) {
  const s = it.sub, mz = muzzleOf(it, _v.set(0, 0, 0)).clone();
  const cp = Math.cos(it.headPitch), dir = _d.set(Math.sin(it.headYaw) * cp, Math.sin(it.headPitch), Math.cos(it.headYaw) * cp);
  // (the head is within the cone of the solved line: shoot along the solve itself, then the crude gun's spread)
  dir.copy(_sol);
  if (s.spread > 0) G.projectiles._spread(dir, s.spread);
  G.projectiles.fireCustom(it.owner, mz, dir, { type: 'shot', speed: s.speed, damage: s.damage, straight: s.straight, range: s.range, radius: 0.7, size: 0.13, trailEvery: 1.2, trailRadius: 0.36, grav: 28, drag: 0.8, weaponId: KIND });
  it.fireT = 0.09; it.shots = (it.shots || 0) + 1; SENTRY_STATS.shots++;
  shotFx(it, mz, dir);
  emit('sentry:fire', { obj: it, owner: it.owner, team: it.team, pos: mz, dir: dir.clone() });
}
function shotFx(it, mz, dir) {
  if (!near(mz, 45)) return;
  G.fx?.muzzle?.(mz, dir, G.teamColors[it.team], 'shooter');
  G.audio?.play('sentry_shot', { pos: mz, volume: it.owner === G.local ? 0.42 : 0.5 });
}
// a ghost's head: on its target as this screen shows them; its bursts' flashes from the owner's [6]
function ghostAim(it, dt) {
  const s = it.sub, T = it.target;
  if (T && T.alive) {
    const mz = muzzleOf(it, _m);
    _v3.set(T.pos.x, chestY(T), T.pos.z).sub(mz);
    turnHead(it, dt, Math.atan2(_v3.x, _v3.z), clamp(Math.atan2(_v3.y, Math.hypot(_v3.x, _v3.z)), -35 * DEG, 50 * DEG), s.turnYaw, s.turnPitch);
    it.lockT += dt;
    if (!it.locked && it.lockT >= s.lock) it.locked = true;
  } else if (it.state === 'watch') idleSweep(it, dt);
  if (it.ghostShots > 0 && (it.ghostShotT -= dt) <= 0) {
    it.ghostShots--; it.ghostShotT += s.burstGap; it.fireT = 0.09;
    const mz = muzzleOf(it, _v.set(0, 0, 0)).clone(), cp = Math.cos(it.headPitch);
    shotFx(it, mz, _d.set(Math.sin(it.headYaw) * cp, Math.sin(it.headPitch), Math.cos(it.headYaw) * cp));
  }
}

// ================================================================================================= damage + endings
// enemy fire of every kind (wave 1): its descriptor's hurt → G.deploy.struck (the flash, the shooter's marker); a ghost's
// hit goes to its owner; a ghost shot (netMuted) never hurts a real one
function hurt(it, dmg, by) {
  if (!live(it)) return;
  G.deploy?.struck(it.desc, dmg, by);
  if (netMuted() || !(dmg > 0)) return;
  if (it.ghost) { netHurt(it.owner, KIND, it.gid, dmg, by); return; }
  it.hp -= dmg;
  if (it.hp <= 0) return downBy(it, 'shot', by);
  if (G.time - it.hpT > 0.15) { it.hpT = G.time; netRec(it.owner, KIND, [5, it.gid, Math.max(0, Math.round(it.hp))]); }
}
// an ending the kit decides that destroys it (shot down, its own body-in-block test, an era flip, the lava): the one
// 'device:down' and its counter step (§0.2), then the end
function downBy(it, how, by = null) {
  if (!live(it)) return;
  if (how === 'shot') bump(DEPLOY_STATS.down); else bump(DEPLOY_STATS.crushed);
  emit('device:down', { kind: KIND, team: it.team, pos: it.pos.clone(), by: by || null, how });
  if (how === 'shot' && !it.ghost) emit('sub:note', { actor: it.owner, kind: KIND, text: 'SENTRY DOWN' });
  end(it, how === 'shot' ? 'shot' : how === 'lava' ? 'lava' : 'crush', by);
}
function bump(o) { o[KIND] = (o[KIND] || 0) + 1; }
// why → the end record's code, the look: 'time' (0, a fold), 'shot' (1, a burst of tin), 'crush' / 'lava' / 'flip' /
// 'shell' (2, the crunch / a sizzle), 'fold' / 'owner' / 'replaced' / 'carried' (3, a fold), 'drop' / 'lost' (none, a puff)
const CODE = { time: 0, shot: 1, crush: 2, lava: 2, flip: 2, shell: 2, fold: 3, owner: 3, replaced: 3, carried: 3 };
function end(it, why, by) {
  if (!live(it)) return;
  const s0 = it.sub;
  it.state = 'dead'; it.why = why; it.rb.state = 'dead';
  if (!it.ghost && CODE[why] !== undefined) netRec(it.owner, KIND, [2, it.gid, CODE[why]]);
  SENTRY_STATS.ends[why] = (SENTRY_STATS.ends[why] || 0) + 1;
  // (c: the look's middle, drawn size; ce: the events', gameplay size — [sub-view] the same at any view scale)
  const c = _v.copy(it.pos).setY(it.pos.y + 0.35 * it.vs).clone(), ce = it.pos.clone().setY(it.pos.y + s0.hitH * 0.5), col = G.teamColors[it.team];
  if (why === 'shot') {
    if (near(c, 45)) {
      G.fx?.explosion?.(c, col, 0.8);
      G.fx?.burst?.(c, UP, col, { count: 14, speed: 4, size: 0.09 });
      G.fx?.burst?.(c, UP, new THREE.Color(0.72, 0.42, 0.26), { count: 10, speed: 4.5, size: 0.07, sheet: false });   // tin bits
      G.fx?.burst?.(c, UP, new THREE.Color(0.37, 0.7, 0.66), { count: 5, speed: 3.5, size: 0.07, sheet: false });
      G.cues?.sub(KIND, 'end', { owner: it.owner, team: it.team, at: c });   // sfx-cues: the can crumple
    }
    emit('sub:destroyed', { kind: KIND, pos: ce, team: it.team });
  } else if (why === 'lava') G.deploy?.sizzle?.(c, it.team, it.owner);
  else if (CODE[why] === 2) { G.deploy?._crunch?.(c, it.team, it.owner); emit('sub:destroyed', { kind: KIND, pos: ce, team: it.team }); }
  else if (why !== 'drop') {
    if (near(c, 40)) G.cues?.one('sentry_fold', { at: c, owner: it.owner, team: it.team, kind: 'end', sub: true, vol: 0.8 });
  }
  // the look plays on a moment (a fold, a crumple) before the mesh goes; the gameplay is over now
  it.endT = 0;
  fading.push(it);
  emit('sub:end', { kind: KIND, why, team: it.team, pos: it.pos.clone() });
}
function dispose(it) {
  G.scene?.remove(it.m.outer);
  it.m.lampMat.dispose();
  if (it.line) { G.scene?.remove(it.line); it.line.material.dispose(); it.line = null; }
}

// ================================================================================================= looks
const _flashMats = new Map();
function flashMat(team) {
  const c = G.teamColors[team], k = c.getHexString();
  let m = _flashMats.get(k);
  if (!m) _flashMats.set(k, (m = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1).lerp(c, 0.18) })));
  return m;
}
const LINE_GEO = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true).translate(0, 0.5, 0).rotateX(Math.PI / 2);   // along +Z, 0 … 1
const _white = new THREE.Color(1, 1, 1);
function looks(it, dt) {
  const s = it.sub, M_ = it.m, t = it.t, vs = it.vs;
  M_.outer.position.copy(it.pos);
  const by = baseYaw(it);
  M_.outer.rotation.set(0, by, 0);
  // unfold: a thump, the legs ratcheting out (with a tick-tick), the head popping up with a spring
  const u = clamp(t / s.setup, 0, 1);
  const legK = it.state === 'dead' ? 1 - clamp(it.endT / 0.25, 0, 1) : clamp((u - 0.12) / 0.55, 0, 1);
  const tick = Math.floor(legK * 6) / 6, splay = legK >= 1 ? 1 : tick + (legK - tick) * 0.4;
  for (const L of M_.legs) L.rotation.x = FOLD * (1 - splay) - (legK >= 1 && it.state !== 'dead' ? Math.max(0, Math.sin(clamp((u - 0.67) / 0.2, 0, 1) * Math.PI)) * 0.08 : 0);
  const popK = it.state === 'dead' ? 1 - clamp(it.endT / 0.2, 0, 1) : clamp((u - 0.55) / 0.45, 0, 1);
  const pop = popK >= 1 ? 1 : 1 - Math.cos(popK * Math.PI * 2.5) * Math.exp(-popK * 4) * (1 - popK) - (1 - popK) * 0.6;
  M_.neck.scale.set(1, Math.max(0.02, pop), 1);
  const thump = it.state === 'dead' ? 0 : Math.max(0, 1 - t / 0.14) * 0.12;
  M_.model.position.y = (1 - splay) * 0.012 * WS * vs;
  const fl = it.flash;
  M_.model.scale.set(WS * vs * (1 + 0.14 * fl + thump), WS * vs * (1 - 0.1 * fl - thump), WS * vs * (1 + 0.14 * fl + thump));
  // the head: its yaw relative to the base, its pitch; a cough jitter when sputtering
  const sput = it.state === 'watch' && t > s.life - 3;
  M_.swivel.rotation.y = angleDiff(by, it.headYaw) + (sput ? Math.sin(t * 47) * 0.03 : 0);
  M_.pitch.rotation.x = -it.headPitch - (it.fireT > 0 ? 0.06 * (it.fireT / 0.09) : 0);   // (a kick per round)
  M_.pitch.position.z = it.fireT > 0 ? -0.004 * (it.fireT / 0.09) : 0;
  // the tank drains over its life
  M_.win.scale.y = clamp(1 - t / s.life, 0.03, 1);
  // the lamp: a slow team-coloured pulse idle, blinking white while it locks, bright while it fires
  const lm = M_.lampMat, col = G.teamColors[it.team];
  const locking = it.target && !it.locked && it.state === 'watch';
  if (locking || (it.ghost && it.target && it.lockT < s.lock)) { const on = Math.floor(it.lockT * 12) % 2 === 0; lm.emissive.copy(on ? _white : col); lm.emissiveIntensity = on ? 3.2 : 0.6; }
  else if (it.fireT > 0 || (it.locked && it.target)) { lm.emissive.copy(col); lm.emissiveIntensity = it.fireT > 0 ? 4 : 2.2; }
  else { lm.emissive.copy(col); lm.emissiveIntensity = it.state === 'unfold' ? 0.3 : 0.55 + 0.4 * Math.sin(G.time * 2.4 + it.gid); }
  it.fireT = Math.max(0, it.fireT - dt);
  // the hit flash: white with a squash (wave 1's look, its own meshes)
  it.flash = Math.max(0, it.flash - dt * 5.5);
  const white = it.flash > 0.45 && it.state !== 'dead';
  if (white !== it.flashOn) {
    it.flashOn = white;
    for (const m of M_.parts) { if (white) { m.userData.mat0 = m.material; m.material = flashMat(it.team); } else if (m.userData.mat0) { m.material = m.userData.mat0; m.userData.mat0 = null; } }
  }
  // the aim line while it locks (0.4 s): faint, team-coloured, muzzle to them
  lockLine(it, dt);
  if (it.state !== 'watch' || !near(it.pos, 45)) return;
  // damaged (under 40 hp): sparks and a smoke trail; running dry (its last 3 s): coughs of smoke from the nozzle
  if (it.hp < 40 && (it.smokeT -= dt) <= 0) {
    it.smokeT = 0.18 + Math.random() * 0.12;
    const c = _v.set(it.pos.x, it.pos.y + 0.45 * vs * 0.67, it.pos.z);
    G.fx?.mist?.(c, _v2.set((Math.random() - 0.5) * 0.3, 0.9, (Math.random() - 0.5) * 0.3), new THREE.Color(0.25, 0.24, 0.26), 0.32, 0.5);
    if (Math.random() < 0.5) G.fx?.burst?.(c, UP, new THREE.Color(1, 0.8, 0.35), { count: 3, speed: 2.4, size: 0.03, sheet: false });
  }
  if (sput && (it.coughT -= dt) <= 0) {
    it.coughT = 0.7 + Math.random() * 0.4;
    const mz = muzzleOf(it, _v);
    G.fx?.mist?.(mz, _v2.set(Math.sin(it.headYaw) * 0.8, 0.4, Math.cos(it.headYaw) * 0.8), new THREE.Color(0.6, 0.6, 0.62), 0.22, 0.55);
    G.cues?.one('sentry_sputter', { at: mz.clone(), owner: it.owner, team: it.team, kind: 'use', sub: true, range: 20, vol: 0.7 });
  }
}
function lockLine(it, dt) {
  const T = it.target, show = !!T && (T.alive || T.bossT) && it.lineT > 0 && live(it);
  if (it.lineT > 0) it.lineT -= dt;
  if (!show) { if (it.line) it.line.visible = false; return; }
  if (!it.line) {
    const col = G.teamColors[it.team].clone().lerp(_white, 0.25);
    it.line = new THREE.Mesh(LINE_GEO, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.35, depthWrite: false }));
    it.line.renderOrder = 4; it.line.frustumCulled = false;
    it.line.onBeforeRender = (r, sc, c, geo) => { geo.drawRange.count = sc.overrideMaterial ? 0 : Infinity; };
    G.scene.add(it.line);
  }
  const mz = muzzleOf(it, _v), cy = T.bossT ? T.pos.y + 0.7 : chestY(T);
  _v2.set(T.pos.x, cy, T.pos.z);
  const len = mz.distanceTo(_v2);
  it.line.position.copy(mz);
  it.line.lookAt(_v2);
  it.line.scale.set(0.012, 0.012, len);
  it.line.material.opacity = 0.18 + 0.22 * clamp(it.lineT / it.sub.lock, 0, 1) * (0.6 + 0.4 * Math.sin(G.time * 40));
  it.line.visible = true;
}
// an ended sentry, still on screen a moment: legs folding, head dropping (a fold), or squashing flat (a crunch)
function fadeLook(it, dt) {
  it.endT += dt;
  const crush = CODE[it.why] === 2 || it.why === 'shot';
  if (crush) { it.m.model.scale.y *= 0.6; it.m.outer.visible = it.endT < 0.12; return it.endT > 0.12; }
  if (it.why === 'drop' || it.why === 'lost') {   // (its owner left / its records stopped: a quiet puff, nothing else)
    if (near(it.pos, 40)) G.fx?.burst?.(_v.copy(it.pos).setY(it.pos.y + 0.3), UP, new THREE.Color(0.7, 0.7, 0.72), { count: 8, speed: 1.8, size: 0.07, mist: true });
    return true;
  }
  looks(it, dt);
  if (it.endT > 0.3) {
    if (near(it.pos, 40)) G.fx?.burst?.(_v.copy(it.pos).setY(it.pos.y + 0.25), UP, G.teamColors[it.team], { count: 8, speed: 2.4, size: 0.06, mist: true });
    return true;
  }
  return false;
}

// ================================================================================================= the aim guide
// While the button is held (local): a translucent sentry where it would go, and a dashed 11 m ring on the floor round it
// at 30 %: team colour when the spot is good, grey with a small "×" over it when it isn't
const RING_GEO = new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2);
const RING_FS = `
  uniform vec3 uColor; uniform float uAlpha; uniform float uTime; uniform float uR; varying vec2 vUv;
  void main(){
    float r = length(vUv);
    if (r > 1.01) discard;
    float w = 0.09 / uR;
    float rim = smoothstep(w, w * 0.4, abs(r - 0.985));
    float ang = atan(vUv.y, vUv.x);
    float dash = step(0.45, fract(ang / 6.2831853 * 64.0 + uTime * 0.25));
    float fill = 0.12 * smoothstep(0.0, 0.98, r) * step(r, 0.98);
    gl_FragColor = vec4(uColor, (rim * dash + fill) * uAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
const RING_VS = `varying vec2 vUv; void main(){ vUv = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
let guide = null;
function guideMesh() {
  if (guide) return guide;
  const g = worldGeo();
  const leg = g.leg;
  const geo = mergeGeometries([g.hub, ...LEG_AZ.map((_, k) => leg.clone().applyMatrix4(legMatrix(k, 0))), g.head.clone().translate(0, HEAD_Y, 0)].map((x) => {
    const y = new THREE.BufferGeometry(); y.setAttribute('position', x.attributes.position); y.setAttribute('normal', x.attributes.normal); y.setIndex(x.index); return y;
  }), false);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.38, depthWrite: false });
  const ghostM = new THREE.Mesh(geo, mat); ghostM.renderOrder = 3;
  ghostM.onBeforeRender = (r, sc, c, gg) => { gg.drawRange.count = sc.overrideMaterial ? 0 : Infinity; };
  const ring = new THREE.Mesh(RING_GEO, new THREE.ShaderMaterial({ uniforms: { uColor: { value: new THREE.Color() }, uAlpha: { value: 0.3 }, uTime: { value: 0 }, uR: { value: 11 } },
    vertexShader: RING_VS, fragmentShader: RING_FS, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
  ring.renderOrder = 3; ring.frustumCulled = false;
  ring.onBeforeRender = (r, sc, c, gg) => { gg.drawRange.count = sc.overrideMaterial ? 0 : Infinity; };
  // the "×"
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const x = cv.getContext('2d'); x.lineCap = 'round';
  x.strokeStyle = '#15121c'; x.lineWidth = 16; x.beginPath(); x.moveTo(14, 14); x.lineTo(50, 50); x.moveTo(50, 14); x.lineTo(14, 50); x.stroke();
  x.strokeStyle = '#ff5f73'; x.lineWidth = 8; x.stroke();
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const cross = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  cross.renderOrder = 5; cross.scale.setScalar(0.32);
  const root = new THREE.Group(); root.add(ghostM, ring, cross);
  guide = { root, ghostM, ring, cross, mat };
  return guide;
}
let guideT = 0;
function guideFx(dt) {
  const a = G.local;
  const show = !!(a && a.alive && a.weaponRunner?.aimingSub && a.sub?.kind === KIND && !(a.specialActive?.kind === 'barrage') && G.match && !G.match.attract);
  if (!show) { if (guide) guide.root.visible = false; return; }
  const gd = guideMesh();
  if (gd.root.parent !== G.scene) G.scene.add(gd.root);
  if ((guideT -= dt) <= 0 || !gd.root.visible) {
    guideT = 1 / 30;
    const S = findSpot(a, a.sub), vs = subViewScale(KIND), s = a.sub;
    const ok = S.ok && a.ink >= s.inkCost;
    // (refused: shown where it would have gone, ahead of the feet)
    const p = S.ok ? S.point : _v.set(a.pos.x + Math.sin(a.aimYaw) * 0.9, a.pos.y, a.pos.z + Math.cos(a.aimYaw) * 0.9);
    gd.root.position.copy(p);
    gd.ghostM.rotation.y = a.aimYaw; gd.ghostM.scale.setScalar(WS * vs);
    const col = ok ? a.color : _grey;
    gd.mat.color.copy(col); gd.mat.opacity = ok ? 0.42 : 0.3;
    gd.ring.position.y = 0.03; gd.ring.scale.setScalar(s.range);
    gd.ring.material.uniforms.uColor.value.copy(col); gd.ring.material.uniforms.uR.value = s.range;
    gd.cross.visible = !S.ok; gd.cross.position.set(0, (HEAD_Y + 0.07) * WS * vs, 0);
    gd.ok = S.ok; gd.why = S.why;
  }
  gd.ring.material.uniforms.uTime.value = G.time;
  gd.root.visible = true;
}
const _grey = new THREE.Color(0.62, 0.62, 0.66);

// ================================================================================================= HUD: the life ring
// While your sentry stands, the sub badge carries a small ring: its 15 s running down (team colour, white while it locks)
let lifeEl = null;
function lifeHud() {
  const H = G.hud, me = G.local;
  const it = me ? items.find((x) => x.owner === me && !x.ghost && live(x)) : null;
  if (!H?.subBadge || (!it && !lifeEl)) return;
  if (!lifeEl || lifeEl.parentNode !== H.subBadge) {
    lifeEl?.remove();
    lifeEl = document.createElement('i');
    lifeEl.className = 'iw-sentry-life';
    lifeEl.style.cssText = 'position:absolute;right:-22%;bottom:-22%;width:52%;height:52%;pointer-events:none;filter:drop-shadow(0 1px 0 rgba(0,0,0,.45));transition:opacity .2s';
    lifeEl.innerHTML = '<svg viewBox="0 0 40 40" width="100%" height="100%"><circle cx="20" cy="20" r="17" fill="rgba(14,11,22,.82)"/><circle class="t" cx="20" cy="20" r="13" fill="none" stroke-width="6" stroke-linecap="round" pathLength="100" transform="rotate(-90 20 20)"/><circle class="d" cx="20" cy="20" r="3.4" fill="#fff"/></svg>';
    H.subBadge.appendChild(lifeEl);
    lifeEl._t = lifeEl.querySelector('.t'); lifeEl._d = lifeEl.querySelector('.d');
  }
  lifeEl.style.opacity = it ? '1' : '0';
  if (!it) return;
  const k = clamp(1 - it.t / it.sub.life, 0, 1), col = G.teamHex?.[it.team] || '#fff';
  lifeEl._t.setAttribute('stroke', col);
  lifeEl._t.setAttribute('stroke-dasharray', `${(k * 100).toFixed(1)} 100`);
  lifeEl._d.setAttribute('fill', it.target && !it.locked ? '#ffffff' : it.target ? col : '#8f98a6');
  lifeEl.dataset.k = k.toFixed(3);
}

// ================================================================================================= bots, descriptors
// wave 1's device descriptor (deployables.js: shots, the tower, rolls, standing fire, crushIn, the bots' device pick)
function descOf(it) {
  const s = it.sub, aim = new V3();
  return {
    kind: KIND, kit: true, obj: it, get team() { return it.team; }, get owner() { return it.owner; }, pos: it.pos,
    get aim() { return aim.set(it.pos.x, it.pos.y + s.hitH * 0.5, it.pos.z); },
    r: s.hitR, h: s.hitH, hitH: s.hitH, normal: UP,
    get floor() { const b = it.rb.on?.b; return b ? b.id : it.floorId ?? -1; },
    get ghost() { return it.ghost; }, get rides() { return it.rb.on ? it.rb.on.b : null; },
    get live() { return live(it); },
    prefer: () => 0.8,   // (as the Hop Beacon: it hurts)
    hurt: (dmg, by) => hurt(it, dmg, by),
    crush: (how) => end(it, how === 'lava' ? 'lava' : how === 'flip' ? 'flip' : how === 'shell' ? 'shell' : 'crush', null),
    flash: () => { it.flash = 1; if (near(it.pos, 30) && G.time - (it._tokT ?? -9) > 0.09) { it._tokT = G.time; const c = _v.copy(it.pos).setY(it.pos.y + 0.4); G.cues?.one('device_hit', { at: c, owner: it.owner, team: it.team, kind: 'end', vol: 0.7 }); G.cues?.one('sentry_hit', { at: c.clone(), owner: it.owner, team: it.team, kind: 'end', vol: 0.8 }); } },
  };
}
// the bots' threat descriptor (bots.js _threatScore's turret branch: shoot it, or get out of its range / sight)
function threatOf(it) {
  const s = it.sub;
  return {
    kind: KIND, obj: it, get team() { return it.team; }, get owner() { return it.owner; }, pos: it.pos, aimY: 0.45, ground: true, turret: true,
    range: s.range, radius: 0, trigger: 0, speed: 0, vel: ZERO,
    get live() { return live(it); }, get state() { return it.state === 'watch' ? 'watch' : 'unfold'; }, get hp() { return it.hp; },
    get shootable() { return live(it); },
    get locked() { return !!it.target && !it.target.bossT && live(it); },
    get target() { return it.target && !it.target.bossT && live(it) ? it.target : null; },
  };
}
const mateSentryNear = (a, r) => items.some((o) => live(o) && o.team === a.team && o.owner !== a && Math.hypot(o.pos.x - a.pos.x, o.pos.z - a.pos.z) < r);
// a bot sets one down: the spot must be good (no "Can't use" from a bot), no teammate's within 6 m, then a long cooldown
// yaws: the ways it may set it down (the first good one wins; the release follows it: b._sentryAim)
function botGo(b, yaws = null) {
  const a = b.a;
  if (mateSentryNear(a, 6)) return false;
  let ok = false;
  for (const yaw of yaws || [a.aimYaw]) {
    b._sentryAim = { yaw, t: G.time };
    if (findSpot(a, a.sub).ok) { ok = true; break; }
  }
  if (!ok) { b._sentryAim = null; return false; }
  b.bombCd = 10 + Math.random() * 4;
  SENTRY_STATS.botUses++;
  return true;
}
const around = (y0, n = 8) => Array.from({ length: n }, (_, k) => y0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (TAU / n));
const BOT = {
  rides: true,   // (set down on the moving tower's deck too: it rides it — bots.js _paintSub's !onT exception)
  // a known foe 6–14 m off, not hit in the last 1 s: 2.5 % a frame — down 0.9 m ahead toward the fight
  fight(b, dist) {
    const a = b.a;
    if (dist < 6 || dist > 14 || a.lastDamage < 1 || Math.random() > 0.025) return false;
    return botGo(b, [a.aimYaw, a.aimYaw + 0.6, a.aimYaw - 0.6]);   // (toward the fight)
  },
  paint(b) {
    const a = b.a, m = G.match;
    if (!m) return false;
    // Zone Control: a guard within 6 m of its zone's edge, facing the enemy side
    if (m.zones && b.zRole) {
      if (b.zRole !== 'guard' || Math.random() > 0.015) return false;
      const z = m.zones.zones?.[b.zZone];
      if (!z) return false;
      const dz = Math.hypot(a.pos.x - z.center[0], a.pos.z - z.center[2]);
      if (Math.abs(dz - (z.reach || 5)) > 6) return false;
      const ep = enemyPad(a.team), fx = Math.sin(a.aimYaw), fz = Math.cos(a.aimYaw);
      if ((ep.x - a.pos.x) * fx + (ep.z - a.pos.z) * fz <= 0) return false;
      const ey = Math.atan2(ep.x - a.pos.x, ep.z - a.pos.z);
      return botGo(b, [a.aimYaw, ey, ey + 0.5, ey - 0.5]);   // (facing their side)
    }
    // Tower Command: a rider on the deck, no teammate's sentry on it already
    if (m.tower) {
      const T = m.tower;
      if (b.tRole !== 'ride' || !T.riderList?.includes(a) || Math.random() > 0.02) return false;
      if (items.some((o) => live(o) && o.team === a.team && o.rb.on && o.rb.on.b === T.block)) return false;
      return botGo(b, around(Math.atan2(a.pos.x - T.pos.x, a.pos.z - T.pos.z)));   // (out from the pillar: its deck's ring)
    }
    // Turf War: near the front line (0.4–0.7 of the way to their pad, as _paintSub measures it)
    if (Math.random() > 0.004) return false;
    const pads = G.level.spawnPads, total = pads[0].distanceTo(pads[1]);
    const progress = 1 - Math.hypot(a.pos.x - pads[1 - a.team].x, a.pos.z - pads[1 - a.team].z) / total;
    if (progress < 0.4 || progress > 0.7) return false;
    return botGo(b);
  },
};
// a bot hit by its rounds notices that sentry at once (its spot becomes threat memory; it doesn't reveal the owner:
// botSight treats sub ids as "not a weapon")
on('hit', (e) => {
  if (e.weaponId !== KIND || !e.victim?.bot || !e.attacker) return;
  const it = items.find((x) => x.owner === e.attacker && live(x));
  const b = e.victim.bot;
  if (!it || !b._thrMem) return;
  if (!b._thrMem.has(it.thr) || b._thrMem.get(it.thr) > G.time) { b._thrMem.set(it.thr, G.time); SENTRY_STATS.noticed++; }
  b.thrCand = it.thr; b.thrScanT = Math.min(b.thrScanT ?? 0, 0.05);
});
// its owner splatted: it folds at once (like the Twirl Sprinkler); the owner's screen decides (a ghost waits for [2])
on('splatted', ({ victim }) => { for (const it of items) if (it.owner === victim && !it.ghost && live(it)) end(it, 'owner', null); });
// bluestone's era flips (its payload: block ids): a sentry whose floor went, or whose body a new block fills, ends
on('era:flip', (e) => {
  const offs = new Set(e?.off || []), ons = (e?.on || []).map((id) => G.level.blocks[id]).filter(Boolean);
  for (const it of items) {
    if (it.ghost || !live(it)) continue;
    const g = G.physics.raycast(_v.set(it.pos.x, it.pos.y + 0.3, it.pos.z), DOWN, 0.6, _hit);
    const gone = g.hit ? offs.has(g.block) : offs.size > 0 && offs.has(it.floorId);
    if (gone || (ons.length && G.deploy?._bodyIn(ons, it.pos, it.sub.hitH, it.sub.hitR))) downBy(it, 'flip');
  }
});

// ================================================================================================= minimap
// everyone's sentries (as everyone's sprinklers): a little turret in team colour, its barrel the way the head looks,
// its 11 m reach at 30 %; your team's also carry their life ring
function drawMap(c, mm, tc, s, hex, viewer) {
  for (const it of items) {
    if (!live(it)) continue;
    mm.toCanvas(it.pos.x, it.pos.z, tc);
    const col = hex[it.team] || '#fff', R = it.sub.range * s;
    c.globalAlpha = 0.3; c.lineWidth = 1.5; c.strokeStyle = col; c.beginPath(); c.arc(tc.x, tc.y, R, 0, TAU); c.stroke();
    c.globalAlpha = 0.08; c.fillStyle = col; c.fill(); c.globalAlpha = 1;
    const r = Math.max(2.2, s * 0.62);
    // (the minimap's canvas: x right, y down = +z; the head's yaw from +z toward +x)
    _v.set(0, 0, 0); mm.toCanvas(it.pos.x + Math.sin(it.headYaw), it.pos.z + Math.cos(it.headYaw), _bar);
    let bx = _bar.x - tc.x, bz = _bar.y - tc.y; const bl = Math.hypot(bx, bz) || 1; bx /= bl; bz /= bl;
    c.lineCap = 'round';
    c.lineWidth = r * 0.9 + 2; c.strokeStyle = '#15121c'; c.beginPath(); c.moveTo(tc.x, tc.y); c.lineTo(tc.x + bx * r * 2.1, tc.y + bz * r * 2.1); c.stroke();
    c.lineWidth = r * 0.9; c.strokeStyle = col; c.stroke();
    c.beginPath(); c.moveTo(tc.x - r, tc.y + r * 0.95); c.lineTo(tc.x + r, tc.y + r * 0.95); c.lineTo(tc.x + r * 0.8, tc.y - r * 0.6); c.lineTo(tc.x - r * 0.8, tc.y - r * 0.6); c.closePath();
    c.fillStyle = '#15121c'; c.lineWidth = 2; c.strokeStyle = '#15121c'; c.stroke(); c.fillStyle = col; c.fill();
    c.beginPath(); c.arc(tc.x, tc.y - r * 0.7, r * 0.42, 0, TAU); c.fillStyle = it.target ? '#fff' : '#15121c'; c.fill();
    if (it.team === viewer) {
      const k = clamp(1 - it.t / it.sub.life, 0, 1);
      c.lineWidth = 2; c.strokeStyle = '#15121c'; c.beginPath(); c.arc(tc.x, tc.y, r * 1.9, 0, TAU); c.stroke();
      c.strokeStyle = col; c.beginPath(); c.arc(tc.x, tc.y, r * 1.9, -Math.PI / 2, -Math.PI / 2 + TAU * k); c.stroke();
    }
  }
}
const _bar = { x: 0, y: 0 };

// ================================================================================================= registration
export const SENTRY_STATS = { shots: 0, botUses: 0, noticed: 0, ends: {} };
export function resetSentryStats() { SENTRY_STATS.shots = 0; SENTRY_STATS.botUses = 0; SENTRY_STATS.noticed = 0; SENTRY_STATS.ends = {}; }
SUB_KITS[KIND] = {
  noArc: true,                    // (SUBS.sentry.placed hides the bomb arc too: the kit draws its own guide)
  blocked: (a, sub) => !findSpot(a, sub).ok,
  blockedWhy: (a, sub) => { const S = findSpot(a, sub); return S.ok ? '' : WHY[S.why] || ''; },
  use,
  ghost,
  netHurt(gid, dmg, by) { const it = items.find((x) => !x.ghost && x.gid === gid && live(x)); if (it) hurt(it, dmg, by); },
  tick(dt) {
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      if (live(it)) {
        if (it.rb.on) G.deploy?.carry(it.rb);   // riding a moving block (wave 1's one rule)
        it.rb.ghost = it.ghost;
      }
      if (live(it)) {
        it.t += dt; it.age += dt;
        if (it.state === 'unfold' && it.t >= 0.06 && !it.unfoldSnd) { it.unfoldSnd = true; G.cues?.sub(KIND, 'land', { owner: it.owner, team: it.team, at: it.pos }); }
        ghostMute(it, () => step(it, dt));
      }
      if (live(it)) looks(it, dt);
      if (!live(it)) items.splice(i, 1);
    }
    for (let i = fading.length - 1; i >= 0; i--) if (fadeLook(fading[i], dt)) { dispose(fading[i]); fading.splice(i, 1); }
    guideFx(dt);
    lifeHud();
  },
  clear() {
    for (const it of items) { it.state = 'dead'; it.rb.state = 'dead'; dispose(it); }
    for (const it of fading) dispose(it);
    items.length = 0; fading.length = 0;
    if (guide) guide.root.visible = false;
    if (lifeEl) lifeEl.style.opacity = '0';
  },
  // enemy shots and beams stop on its capsule (r hitR, h hitH: config numbers, never the drawn model)
  blockShot(prev, pos, team, dmg, by) {
    for (const it of items) {
      if (it.team === team || !live(it)) continue;
      Physics.segmentCapsuleDist(prev, pos, it.pos, it.sub.hitR, it.sub.hitH, _res);
      if (_res.dist < it.sub.hitR + 0.04) { hurt(it, dmg, by); return true; }
    }
    return false;
  },
  blockRay(from, dir, len, team, dmg, by) {
    let best = len, hitIt = null;
    for (const it of items) {
      if (it.team === team || !live(it)) continue;
      const r = rayCapsule(from, dir, best, it.pos, it.sub.hitH);
      if (r.d < it.sub.hitR + 0.04 && r.t < best) { best = Math.max(0.1, r.t - it.sub.hitR * 0.5); hitIt = it; }
    }
    if (hitIt) hurt(hitIt, dmg, by);
    return best;
  },
  // a blast (G.subs.damageArea: bombs, specials, splashes) catching its capsule
  damageArea(c, radius, dmg, team, by) {
    for (const it of items) {
      if (it.team === team || !live(it)) continue;
      const y = clamp(c.y, it.pos.y, it.pos.y + it.sub.hitH);
      if (Math.hypot(c.x - it.pos.x, c.y - y, c.z - it.pos.z) < radius + it.sub.hitR * 0.5) hurt(it, dmg, by);
    }
  },
  devices(out) { for (const it of items) if (live(it)) out.push(it.desc); return out; },
  rideBodies(out) { for (const it of items) if (live(it)) out.push(it.rb); return out; },
  threats(out) { for (const it of items) if (live(it)) out.push(it.thr); return out; },
  dropOwner(a) { for (const it of items) if (it.owner === a && live(it)) end(it, 'drop', null); },
  // caldera's destroyWhere (H17 / H19): own devices whose foot passes pred end in the lava
  lavaSweep(pred) { let n = 0; for (const it of items) if (!it.ghost && live(it) && pred(it.pos)) { downBy(it, 'lava'); n++; } return n; },
  drawMap,
  items,
  bot: BOT,
  // (tests / tools)
  _findSpot: findSpot, _guide: () => guide, _life: () => lifeEl, WHY,
};
