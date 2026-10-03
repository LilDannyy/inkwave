// INKWAVE — one shade for all ink: the Drainbow's drained player (src/game/sp-drainbow.js; src/fx/drainbowFx.js DrainView
// drives this) can't tell turf apart. The user: "while making everything monochrome, also make all ink appear the same
// colour (shade technically since its monochrome)". Every ink look on this screen — the level's paint (floors, walls,
// the grates), the tower's and the hedges' own ink, shots in flight, ink droplets — mixes its team colour toward ONE
// tint by the amount the grey pass greys that spot: the grey wave's own sweep (world distance from where the player
// crossed, the same ragged front), squared so the ink is never one shade where the screen still shows colour. Under the
// grey both teams' ink then comes out as one identical shade; the seam lip where two teams' inks meet is flattened too.
// Only the local player's screen, only while they're inside an enemy bubble (the wave sweeps it in and back out).
//   INK_ONE        the shared uniform objects — every material that draws ink holds these same refs
//   INK_ONE_PARS   GLSL: the uniforms + inkOneK(worldPos) → 0 (the team colours) … 1 (the one tint)
//   inkOneMap(mat) a map-textured ink overlay (towerPaint.js BoxPaint's canvas: the tower, the hedges) goes one shade
//   inkOneTint(team, p, out) / inkOneK(p)   the same sums on the CPU (tests, the minimap)
import * as THREE from 'three';
import { G } from '../core/ctx.js';

const LW = [0.2126, 0.7152, 0.0722];
export const INK_ONE = {
  uOneC: { value: new THREE.Color(0.5, 0.5, 0.5) },   // the one tint (linear): grey at the two team colours' mean luminance
  uOneW: { value: new THREE.Vector4(0, -1e4, 0, 0) }, // the wave: where it started (xyz), its front's radius (m)
  uOneB: { value: new THREE.Vector4(0, 0, 0, 0) },    // before, after (0 … 1), wave on (0 / 1), time (s: the ragged edge)
};
// (the overall amount right now — the minimap and the HUD read this; DrainView keeps it)
export const INK_ONE_STATE = { level: 0, changes: 0 };

// the one tint for the team colours in play (their mean luminance, a touch lighter: drained, washed-out ink)
export function inkOneSetTint(colA, colB) {
  const l = (c) => c.r * LW[0] + c.g * LW[1] + c.b * LW[2];
  const y = colA && colB ? (l(colA) + l(colB)) * 0.5 * 1.08 : 0.3;
  INK_ONE.uOneC.value.setRGB(y, y, y);
}
// per frame from DrainView: the wave (from, front radius, before → after) or the steady level
export function inkOneSet(level, wave, front, time) {
  const B = INK_ONE.uOneB.value;
  if (wave && wave.before !== wave.after) {
    INK_ONE.uOneW.value.set(wave.from.x, wave.from.y, wave.from.z, front);
    B.set(wave.before, wave.after, 1, time);
  } else B.set(level, level, 0, time);
  const was = INK_ONE_STATE.level > 0.5;
  INK_ONE_STATE.level = level;
  if (was !== level > 0.5) INK_ONE_STATE.changes++;
}

export const INK_ONE_PARS = /* glsl */`
uniform vec3 uOneC;
uniform vec4 uOneW;
uniform vec4 uOneB;
float ioH(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float ioN(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(ioH(i), ioH(i + vec3(1, 0, 0)), f.x), mix(ioH(i + vec3(0, 1, 0)), ioH(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(ioH(i + vec3(0, 0, 1)), ioH(i + vec3(1, 0, 1)), f.x), mix(ioH(i + vec3(0, 1, 1)), ioH(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
// how far this spot's ink has gone to the one tint (the grey pass's own front: drainbowFx.js VIEW_FS)
float inkOneK(vec3 wp) {
  if (uOneB.z < 0.5) return uOneB.y * uOneB.y;
  float wn = ioN(wp * 1.3 + vec3(0.0, uOneB.w * 1.1, 0.0)) * 0.7 + ioN(wp * 4.1 - uOneB.w * 2.0) * 0.3;
  float dW = distance(wp, uOneW.xyz) - uOneW.w + (wn - 0.5) * 0.9;
  float m = mix(uOneB.x, uOneB.y, smoothstep(0.45, -0.45, dW));
  return m * m;
}`;

// the same on the CPU (the noise left out: the front's ragged edge is ±0.45 m)
export function inkOneK(p) {
  const B = INK_ONE.uOneB.value;
  if (B.z < 0.5) return B.y * B.y;
  const W = INK_ONE.uOneW.value, dW = Math.hypot(p.x - W.x, p.y - W.y, p.z - W.z) - W.w;
  const x = Math.min(1, Math.max(0, (0.45 - dW) / 0.9)), s = x * x * (3 - 2 * x), m = B.x + (B.y - B.x) * s;
  return m * m;
}
// the colour team t's ink is drawn in at p on this screen
export function inkOneTint(team, p, out = new THREE.Color()) {
  const c = (G.teamColors && G.teamColors[team]) || out.set(team ? '#2f5bff' : '#ff8a14');
  return out.copy(c).lerp(INK_ONE.uOneC.value, inkOneK(p || { x: 0, y: 0, z: 0 }));
}

// A material drawing ink from a texture map (BoxPaint's canvas, which holds only team colours and alpha): its colour
// goes to the one tint where inkOneK says (world position per pixel). The map's alpha (the ink's edges) is kept.
export function inkOneMap(mat) {
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    prev?.call(mat, sh, r);
    Object.assign(sh.uniforms, INK_ONE);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vOneW;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvOneW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vOneW;\n${INK_ONE_PARS}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
{ float ok = inkOneK(vOneW); if (ok > 0.0) diffuseColor.rgb = mix(diffuseColor.rgb, uOneC, ok); }`);
  };
  const key = mat.customProgramCacheKey?.bind(mat);
  mat.customProgramCacheKey = () => (key ? key() : '') + '|inkOne';
  mat.needsUpdate = true;
  return mat;
}
