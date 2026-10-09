// Ink paint system.
//  * GPU: every paintable face owns a rectangle in one big atlas render target. Splats are drawn as quads straight into
//    the atlas in face space (texture-space painting), so ink wraps across floors/walls/corners exactly like a spherical
//    splash would.
//  * CPU: a parallel coarse grid (0.25 m cells) per face answers gameplay queries — "is this spot my ink?" — and
//    tracks turf coverage for scoring. Both sides evaluate the same body edge (blobWobble / wob, or the roller band)
//    so they agree; everything drawn beyond that edge (rays, satellite droplets, fine spatter, wall drips, cosmetic
//    specks from landing droplets) is finer than the gameplay grid and never claims turf.
//
// Atlas encoding (RGBA8, premultiplied by coverage — the level shader divides by A, see src/world/inkShading.js):
//   R = team share (0 = team 0, 1 = team 1), "over" composited: the newest splat wins at a team border
//   G = wetness: every splat lands at 1, a subtract pass dries it to 0 over ≈ 6 s (fresh ink is glossier + prouder)
//   B = per-splat tone
//   A = coverage as a smooth ≈ 3-texel profile, MAX blended (union of splats; redrawing a spreading splat every frame
//       is idempotent). The level shader reads A through a cubic B-spline for a thick, rounded ink height field.
//
// How a splat lands (all timings scale with its size): the body floods out from ≈ 40 % with a strong ease-out, rays
// shoot out ahead of it, satellite droplets thrown off the crown land a beat later (the farthest last), fine spatter
// lands after that, and on walls the lower edge sags into drips that keep running for 1.5–3 s. Each splat also sends
// a ripple across the ink surface (paint.ripple — also used by footsteps / dives / landings via fxHooks).
//
// API: splat(center, radius, team, { seed, stretch: Vector3, stretchAmt, kind, instant, cosmetic }) → m² claimed
//      speck(center, radius, team, seed)  — cosmetic micro-splat (landing droplets), GPU only
//      flood(region, team, { center, y, reach, dur, ease }) — ink a whole region (Zone Control), or wipe it (team -1)
//      ripple(pos, amp, wavelength, speed, life) · setView(camPos) · flush(dt) · sample/sampleWorld/coverage/regionStats
//      startWipe({ k, cx, cz, dur, reach }) — the clear-all-ink wave (practice): a front runs out from (cx, cz) and clears
//      every cell / texel it passes; wipeTag() / splat opts { wk, wr } keep it in step across online clients (see there)
//      exportGrid() / importGrid(data) — the gameplay grid as compact RLE (a late joiner's copy of the turf)
// kind: 'shot' 'line' 'blast' 'bomb' 'trail' 'drop' 'roll' 'speck' (inferred from radius/stretch when omitted;
//       'roll' needs `stretch` = the roll direction and paints a straight-edged band segment instead of a blob)
import * as THREE from 'three';
import { G } from '../core/ctx.js';

const MAX_QUADS = 6000;
const RIP_N = 24;
const _rel = new THREE.Vector3();

const K = { shot: 0, line: 1, blast: 2, bomb: 3, trail: 4, drop: 5, roll: 6, speck: 7 };
const K_SHOT = 0, K_LINE = 1, K_BLAST = 2, K_BOMB = 3, K_TRAIL = 4, K_DROP = 5, K_ROLL = 6, K_SPECK = 7, K_RECT = 8;   // (rect: importGrid's stamps)
// quad half-extent in footprint radii (satellites / spatter reach) and the extra reach below wall splats (drips)
const REACH = [2.45, 2.1, 2.7, 2.75, 2.3, 1.9, 1.25, 1.35, 1.0];
// The clear-all-ink wave (startWipe): its front radius in a splat's wave tag once the wave has finished (JSON has no
// Infinity); the sweep visits the cells in 0.25 m distance buckets.
export const WIPE_DONE = 9999;
const WIPE_BUCKET = 0.25;
const DRIP_REACH = 3.9;

// Main-blob outline: organic lobes + two narrow "fingers" thrown out by the impact. The GPU splat shader evaluates the
// identical function (wob), so the gameplay grid and the rendered ink agree on the edge.
export function blobWobble(ang, seed) {
  return 1 + 0.12 * Math.sin(3 * ang + seed * 6.2831) + 0.08 * Math.sin(5 * ang + seed * 17.0) +
    0.05 * Math.sin(7 * ang + seed * 41.0) + 0.03 * Math.sin(11 * ang + seed * 73.0) + 0.018 * Math.sin(17 * ang + seed * 29.0) +
    0.17 * Math.pow(Math.max(Math.cos(ang - seed * 37.7), 0), 28) + 0.12 * Math.pow(Math.max(Math.cos(ang - seed * 53.3 - 2.1), 0), 36);
}
const WOB_MAX = 1.5;   // upper bound of blobWobble (reach of the CPU cell loop)
// roller band segment (face space, along = roll direction): half length / half width / corner rounding, × radius
const BAND_L = 0.55, BAND_W = 0.62, BAND_R = 0.1;

const QUAD_ATTRS = ['aPos', 'aLocal', 'aSplat', 'aStretch', 'aGrow', 'aW', 'aMask'], QUAD_ATTRS_CLIP = [...QUAD_ATTRS, 'aClip'];
const PAINT_VS = /* glsl */`
attribute vec2 aPos;
attribute vec3 aLocal;
attribute vec4 aSplat;
attribute vec3 aStretch;
attribute vec4 aGrow;
attribute vec3 aW;
attribute vec4 aMask;
varying vec3 vLocal;
varying vec4 vSplat;
varying vec3 vStretch;
varying vec4 vGrow;
varying vec3 vW;
varying vec4 vMask;
#ifdef CLIP
attribute float aClip;
varying float vClip;
#endif
void main() {
  vLocal = aLocal; vSplat = aSplat; vStretch = aStretch; vGrow = aGrow; vW = aW; vMask = aMask;
#ifdef CLIP
  vClip = aClip;
#endif
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const PAINT_FS = /* glsl */`
precision highp float;
varying vec3 vLocal;     // metres from the splat centre in face space; z = centre's distance from the face plane
varying vec4 vSplat;     // final radius, team, seed, flags (isWall + 2 × kind)
varying vec3 vStretch;   // travel direction in face space, smear amount (0 = none)
varying vec4 vGrow;      // x: age / spread time (runs on past 1) · y: drip progress 0..1 · z: 1 = drips only
varying vec3 vW;         // world position of this texel
varying vec4 vMask;      // the wipe wave's mask: never draw where r0 < |xz − c| <= r1 (c = xy, r0 = z, r1 = w)
#ifdef CLIP
// [b5-stagehooks] a stage module's height clip (setClip): no ink below vClip inside its region mask
uniform sampler2D uClipMap;
uniform vec4 uClipBox;
varying float vClip;
#endif
float hsh(float n) { return fract(sin(n) * 43758.5453123); }
float wob(float a, float s) {
  return 1.0 + 0.12 * sin(3.0 * a + s * 6.2831) + 0.08 * sin(5.0 * a + s * 17.0) + 0.05 * sin(7.0 * a + s * 41.0)
    + 0.03 * sin(11.0 * a + s * 73.0) + 0.018 * sin(17.0 * a + s * 29.0)
    + 0.17 * pow(max(cos(a - s * 37.7), 0.0), 28.0) + 0.12 * pow(max(cos(a - s * 53.3 - 2.1), 0.0), 36.0);
}
float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
// thin tapered ray from a (radius ra) to b (radius rb)
float sdRay(vec2 p, vec2 a, vec2 b, float ra, float rb) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0.0, 1.0);
  return length(pa - ba * h) - mix(ra, rb, h);
}
// per kind: rays, satellite droplets, spatter dots, drips
vec4 kindShape(float k) {
  if (k < 0.5) return vec4(5.0, 7.0, 8.0, 3.0);     // shot
  if (k < 1.5) return vec4(3.0, 4.0, 5.0, 2.0);     // charger line
  if (k < 2.5) return vec4(7.0, 9.0, 10.0, 4.0);    // blast
  if (k < 3.5) return vec4(10.0, 12.0, 14.0, 5.0);  // bomb / slam / splat-out
  if (k < 4.5) return vec4(3.0, 4.0, 4.0, 2.0);     // trail drip
  if (k < 5.5) return vec4(2.0, 2.0, 0.0, 1.0);     // droplet paint
  return vec4(0.0);                                  // roller band, speck
}
void main() {
  if (vMask.w > vMask.z) { float mr = length(vW.xz - vMask.xy); if (mr > vMask.z && mr <= vMask.w) discard; }
#ifdef CLIP
  if (vW.y < vClip && texture2D(uClipMap, (vW.xz - uClipBox.xy) * uClipBox.zw).r > 0.5) discard;
#endif
  float R = vSplat.x, team = vSplat.y, seed = vSplat.z;
  float isWall = mod(vSplat.w, 2.0);
  float kind = floor(vSplat.w * 0.5 + 0.01);
  float dn = vLocal.z;
  float r2 = R * R - dn * dn;
  if (r2 <= 0.0) discard;
  float r = sqrt(r2);                                    // footprint radius on this face
  float fall = clamp(r / max(R, 1e-3), 0.0, 1.0);        // 1 on the face the blob hit, smaller on faces it grazes
  vec2 p0 = vLocal.xy;
  float tx = max(max(abs(dFdx(p0.x)), abs(dFdy(p0.x))), max(abs(dFdx(p0.y)), abs(dFdy(p0.y))));   // metres per texel
  vec2 dir = vStretch.xy; float sa = kind > 7.5 ? 0.0 : vStretch.z;
  vec2 p = p0;
  if (sa > 0.0) {                                        // shots: smeared forward along the travel direction
    float a = dot(p, dir); vec2 perp = p - a * dir;
    float s = a > 0.0 ? 1.0 + sa : 1.0 + 0.25 * sa;
    p = perp + dir * (a / s);
  }
  float tn = vGrow.x;
  vec4 ks = kindShape(kind);
  float sd = 1e3;
  if (vGrow.z < 0.5) {
    // ---- body: floods out from ~40 % with a strong ease-out; its final edge is the CPU gameplay edge
    float tb = 1.0 - pow(1.0 - clamp(tn, 0.0, 1.0), 4.0);
    float grow = mix(0.4, 1.0, tb);
    if (kind > 7.5) {
      // importGrid's stamp: a rounded box over a run of grid cells (half extents in vStretch.xy, corner radius z)
      vec2 dq = abs(p0) - vStretch.xy;
      sd = length(max(dq, 0.0)) + min(max(dq.x, dq.y), 0.0) - vStretch.z;
    } else if (kind > 5.5 && kind < 6.5) {
      // roller band: a straight-edged segment across the drum, edges gently wavy
      vec2 bx = vec2(-dir.y, dir.x);
      vec2 q = vec2(dot(p0, dir), dot(p0, bx));
      float wv = r * (0.03 * sin(q.x / r * 9.0 + seed * 30.0) + 0.018 * sin(q.x / r * 23.0 + seed * 11.0));
      vec2 dq = abs(q) - vec2(r * ${BAND_L} * grow, r * ${BAND_W} + wv);
      sd = length(max(dq, 0.0)) + min(max(dq.x, dq.y), 0.0) - r * ${BAND_R};
    } else if (kind > 6.5) {
      sd = length(p) - r * grow * (1.0 + 0.12 * sin(3.0 * atan(p.y, p.x) + seed * 20.0));
    } else {
      sd = length(p) - r * grow * wob(atan(p.y, p.x), seed);
    }
    float dirAng = sa > 0.0 ? atan(dir.y, dir.x) : 0.0;
    float spread = mix(6.2831, 2.5, clamp(sa * 1.2, 0.0, 1.0));
    bool big = kind > 1.5 && kind < 3.5;
    // ---- rays: short tapered streaks shot out ahead of the body (the splat's "star"), mostly stubby with the odd
    // long one, each ending in a bead where the ink collected as it flew
    float tsp = 1.0 - pow(1.0 - clamp(tn * 1.4, 0.0, 1.0), 3.0);
    for (int k = 0; k < 10; k++) {
      float fk = float(k);
      if (fk >= ks.x) break;
      float h1 = hsh(seed * 7.31 + fk * 1.93), h2 = hsh(seed * 3.17 + fk * 5.71), h3 = hsh(seed * 11.3 + fk * 2.39);
      float a = sa > 0.0 ? dirAng + (h1 - 0.5) * spread : (fk + 0.35 + 0.6 * h1) / ks.x * 6.2831 + seed * 6.2831;
      vec2 u = vec2(cos(a), sin(a));
      float edge = r * grow * wob(a, seed);
      float len = r * (0.07 + (big ? 0.5 : 0.4) * h2 * h2 * h2) * tsp;
      float wB = r * (0.055 + 0.06 * h3);
      float tipR = max(r * (0.012 + 0.012 * h3), tx * 0.45);
      vec2 tip = u * (edge + len) + vec2(-u.y, u.x) * len * 0.18 * (h1 - 0.5);
      float ray = min(sdRay(p, u * edge * 0.72, tip, wB, tipR), length(p - tip) - tipR * (1.6 + 1.4 * h2));
      sd = smin(sd, ray, r * 0.06);
    }
    // ---- satellite droplets flung off the crown: they land a beat after the body (the farthest last), streaked
    // along their flight line; on walls gravity drags the spray down a little
    for (int k = 0; k < 12; k++) {
      float fk = float(k);
      if (fk >= ks.y) break;
      float h1 = hsh(seed * 13.1 + fk * 7.7), h2 = hsh(seed * 5.3 + fk * 3.1), h3 = hsh(seed * 9.9 + fk * 1.7);
      float tl = 0.28 + 0.95 * h2;
      float land = smoothstep(tl, tl + 0.2, tn);
      if (land <= 0.0) continue;
      float a2 = sa > 0.0 ? dirAng + (h1 - 0.5) * spread : h1 * 6.2831;
      vec2 u = vec2(cos(a2), sin(a2));
      if (isWall > 0.5) u = normalize(mix(u, vec2(0.0, -1.0), 0.32));
      float dist = r * (1.1 + (big ? 1.05 : 0.8) * h2 * h2);
      float rad = r * (0.028 + 0.085 * h3) * fall * (1.0 - 0.4 * h2) * (big ? 0.8 : 1.0) * land;
      vec2 q = p - u * dist;
      float el = 1.0 + (0.5 + 1.6 * sa) * h2;
      q -= u * dot(q, u) * (1.0 - 1.0 / el);
      sd = smin(sd, length(q) - rad, rad * 0.8);
    }
    // ---- fine spatter: tiny dots sprayed farther out, landing last
    for (int k = 0; k < 14; k++) {
      float fk = float(k);
      if (fk >= ks.z) break;
      float h1 = hsh(seed * 17.9 + fk * 4.13), h2 = hsh(seed * 2.71 + fk * 8.09), h3 = hsh(seed * 6.47 + fk * 3.37);
      if (tn < 0.45 + 0.95 * h2) continue;
      float a3 = sa > 0.0 ? dirAng + (h1 - 0.5) * spread * 1.15 : h1 * 6.2831;
      vec2 u = vec2(cos(a3), sin(a3));
      if (isWall > 0.5) u = normalize(mix(u, vec2(0.0, -1.0), 0.25));
      float rad = max(r * (0.011 + 0.02 * h3) * fall, tx * 0.9);
      sd = min(sd, length(p - u * r * (1.3 + 1.2 * h2)) - rad);
    }
  }
  // ---- drips on walls: the lower edge sags into streams that keep running; each thins as its bulbous head carries
  // the ink down, meandering a little
  if (isWall > 0.5 && fall > 0.3 && ks.w > 0.0) {
    float dT = vGrow.y;
    float nD = min(6.0, ks.w + floor(R * 1.2));
    for (int k = 0; k < 6; k++) {
      float fk = float(k);
      if (fk >= nD) break;
      float h1 = hsh(seed * 3.7 + fk * 11.3), h2 = hsh(seed * 8.1 + fk * 2.9), h3 = hsh(seed * 4.3 + fk * 5.9);
      if (k > 1 && h3 < 0.3) continue;
      float x = (h1 * 2.0 - 1.0) * r * 0.72;
      float c = sqrt(max(1.0 - (x / r) * (x / r), 0.0));
      float yTop = -c * r * 0.7;
      float len = c * r * 0.25 + r * (0.3 + 2.3 * h2 * h2) * fall * dT;
      float w = r * (0.042 + 0.04 * h3) * (0.75 + 0.35 * fall);
      vec2 q = p0 - vec2(x, yTop);
      float ty = clamp(-q.y / max(len, 1e-4), 0.0, 1.0);
      q.x += sin(q.y / r * 9.0 + seed * 20.0 + fk * 2.3) * w * 0.35 * ty;
      float wt = w * mix(1.0, 0.6, smoothstep(0.05, 0.85, ty));
      float stream = max(abs(q.x) - wt, max(q.y, -len - q.y));
      vec2 tq = (q - vec2(0.0, -len + w * 0.3)) * vec2(1.0, 0.8);
      float bulb = length(tq) - w * (1.2 + 0.35 * h2) * (0.6 + 0.4 * dT);
      sd = smin(sd, smin(stream, bulb, w * 0.9), w * 1.2);
    }
  }
  float fw = max(fwidth(sd), 1e-5);
  float a = 1.0 - smoothstep(-1.5 * fw, 1.5 * fw, sd);
  if (a <= 0.002) discard;
  gl_FragColor = vec4(team, 1.0, hsh(seed * 1.73), a);   // premultiplied by the blend: team share, wet, tone
}`;

// Region floods (Zone Control): one quad per face the region's cells lie on (their cell bounds + a cell, in atlas
// space), carrying the world position. A texel is flooded when it passes the region's own cell test — inside one of
// its outlines and within [y0, y1] — and the front (r0 < r ≤ r1 from the centre) is crossing it this frame.
const FLOOD_MAXV = 64, FLOOD_MAXP = 6;
const FLOOD_VS = /* glsl */`
attribute vec2 aPos;
attribute vec3 aW;
varying vec3 vW;
void main() { vW = aW; gl_Position = vec4(aPos, 0.0, 1.0); }`;
const FLOOD_FS = /* glsl */`
precision highp float;
uniform vec2 uPoly[${FLOOD_MAXV}];
uniform int uPart[${FLOOD_MAXP + 1}];
uniform int uParts;
uniform vec2 uY;        // floor heights that count
uniform vec2 uC;        // front centre (x, z)
uniform vec2 uR;        // this frame's band of the front: r0 < r <= r1
uniform float uTeam;    // 0 | 1, or -1 = wipe
varying vec3 vW;
float hsh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hsh(i), hsh(i + vec2(1.0, 0.0)), f.x), mix(hsh(i + vec2(0.0, 1.0)), hsh(i + vec2(1.0, 1.0)), f.x), f.y);
}
void main() {
  if (vW.y < uY.x || vW.y > uY.y) discard;
  float r = length(vW.xz - uC);
  if (r <= uR.x || r > uR.y) discard;
  bool inside = false;
  for (int p = 0; p < ${FLOOD_MAXP}; p++) {
    if (p >= uParts) break;
    int a = uPart[p], b = min(uPart[p + 1], ${FLOOD_MAXV});
    bool c = false;
    int j = b - 1;
    for (int k = 0; k < ${FLOOD_MAXV}; k++) {                 // (constant bound: a part is uPoly[a .. b))
      int i = a + k;
      if (i >= b) break;
      vec2 P = uPoly[i], Q = uPoly[j];
      if ((P.y > vW.z) != (Q.y > vW.z) && vW.x < (Q.x - P.x) * (vW.z - P.y) / (Q.y - P.y) + P.x) c = !c;
      j = i;
    }
    if (c) { inside = true; break; }
  }
  if (!inside) discard;
  if (uTeam < -0.5) { gl_FragColor = vec4(0.0); return; }   // wiped: bare floor (written straight, no blending)
  // fresh (wet) ink with a soft, blotchy tone field so the flood isn't one flat sheet
  float tone = clamp(0.5 + 0.6 * (vnoise(vW.xz * 0.6) - 0.5) + 0.3 * (vnoise(vW.xz * 1.9 + 7.0) - 0.5), 0.0, 1.0);
  gl_FragColor = vec4(uTeam, 1.0, tone, 1.0);
}`;

export class PaintSystem {
  constructor(renderer, level, { atlasSize = 4096, maxDensity = 30, cell = 0.25 } = {}) {
    this.renderer = renderer;
    this.level = level;
    this.size = atlasSize;
    this.cell = cell;
    this.pad = 8;            // ≥ 2^maxInkLod texels so mip levels never bleed between faces
    this._layout(maxDensity);
    this._initGrid();
    this._q = [];
    this.growing = [];            // splats still spreading / dripping on screen (the gameplay grid is already updated)
    this.version = 0;          // bumps whenever the CPU grid changes (minimap polling)
    this.clock = 0;
    this.frame = 0;
    this.blockGate = null; this.clip = null; this.aClip = null; this._clip = -1e9;   // [b5-stagehooks] (stage modules)
    this.viewPos = null;       // camera position (setView) — ripples far from it are skipped / evicted first
    // ripple table read by the level shader (inkShading.js): xyz + birth (paint clock) · amp, wavelength, speed, life
    this.rip = new Float32Array(RIP_N * 4);
    this.ripP = new Float32Array(RIP_N * 4);
    this._ripS = new Float32Array(RIP_N);
    this._dryAcc = 0;
    this._floods = [];         // region floods in progress (flood())
    this._floodPrep = new Map();   // region → its cells sorted by distance from the front's centre + atlas quads
    // the clear-all-ink wave (startWipe): wipeK = the last wave started here (0 = none yet), _wipe = the one running,
    // _wipeC = the last wave's centre, _held = replayed splats waiting for this screen's front (see _wipeGate),
    // wipeFx = this frame's sample of inked cells the front cleared (main.js puffs steam off them)
    this.wipeK = 0; this._wipe = null; this._wipeC = null; this._held = [];
    this.wipeFx = { n: 0, pos: new Float32Array(96 * 3), team: new Uint8Array(96), cleared: 0 };
    this._mk = null;           // the mask the splat being drawn carries (cx, cz, r0, r1) — see splat()
    this._initGPU();
  }

  // ------------------------------------------------------------ atlas layout (shelf packing)
  _layout(maxDensity) {
    const faces = this.level.faces.filter((f) => f.paintable);
    this.paintFaces = faces;
    const S = this.size;
    let ppm = maxDensity;
    for (let attempt = 0; attempt < 30; attempt++) {
      if (this._tryPack(faces, ppm, S)) break;
      ppm *= 0.92;
    }
    this.ppm = ppm;
  }
  _tryPack(faces, ppm, S) {
    const pad = this.pad;
    const rects = faces.map((f) => ({ f, w: Math.ceil(f.su * ppm) + pad * 2, h: Math.ceil(f.sv * ppm) + pad * 2 }));
    // rotate nothing; sort by height
    rects.sort((a, b) => b.h - a.h);
    let x = 0, y = 0, rowH = 0;
    for (const r of rects) {
      if (r.w > S) return false;
      if (x + r.w > S) { x = 0; y += rowH; rowH = 0; }
      if (y + r.h > S) return false;
      r.x = x; r.y = y;
      x += r.w; rowH = Math.max(rowH, r.h);
    }
    for (const r of rects) r.f.atlas = { x: r.x, y: r.y, w: r.w, h: r.h, ppm, pad };
    this.usedHeight = y + rowH;
    return true;
  }

  // ------------------------------------------------------------ CPU grid
  _initGrid() {
    let total = 0;
    const lvl = this.level;
    const p = new THREE.Vector3();
    for (const f of this.paintFaces) {
      f.nu = Math.max(1, Math.round(f.su / this.cell));
      f.nv = Math.max(1, Math.round(f.sv / this.cell));
      f.cu = f.su / f.nu; f.cv = f.sv / f.nv;
      f.grid = total;
      total += f.nu * f.nv;
    }
    this.grid = new Uint8Array(total);      // 0 none, 1 team0, 2 team1
    this.dead = new Uint8Array(total);      // cells buried inside other geometry
    this.live = new Uint8Array(total);      // 1: a live turf cell (counted in `counts`)
    this.turfTotal = 0;
    this.turfArea = 0;
    this.counts = [0, 0];                   // live turf cells per team
    for (const f of this.paintFaces) {
      for (let j = 0; j < f.nv; j++) for (let i = 0; i < f.nu; i++) {
        p.copy(f.origin).addScaledVector(f.u, (i + 0.5) * f.cu).addScaledVector(f.v, (j + 0.5) * f.cv).addScaledVector(f.n, 0.06);
        const k = f.grid + j * f.nu + i;
        if (lvl.pointInside(p, 0, f.block)) this.dead[k] = 1;
        else if (f.turf) { this.turfTotal++; this.turfArea += f.cu * f.cv; this.live[k] = 1; }
      }
    }
  }

  // ------------------------------------------------------------ GPU
  _initGPU() {
    const S = this.size;
    this.rt = new THREE.WebGLRenderTarget(S, S, {
      type: THREE.UnsignedByteType, format: THREE.RGBAFormat,
      minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter,
      generateMipmaps: true, depthBuffer: false, stencilBuffer: false,
    });
    this.texture = this.rt.texture;
    this.texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    const g = new THREE.BufferGeometry();
    this.aPos = new Float32Array(MAX_QUADS * 4 * 2);
    this.aLocal = new Float32Array(MAX_QUADS * 4 * 3);
    this.aSplat = new Float32Array(MAX_QUADS * 4 * 4);
    this.aStretch = new Float32Array(MAX_QUADS * 4 * 3);
    this.aGrow = new Float32Array(MAX_QUADS * 4 * 4);
    this.aW = new Float32Array(MAX_QUADS * 4 * 3);      // world position (the wipe mask is a world-space ring)
    this.aMask = new Float32Array(MAX_QUADS * 4 * 4);
    const idx = new Uint32Array(MAX_QUADS * 6);
    for (let i = 0; i < MAX_QUADS; i++) idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
    const mk = (arr, n) => { const a = new THREE.BufferAttribute(arr, n); a.setUsage(THREE.DynamicDrawUsage); return a; };
    g.setAttribute('aPos', mk(this.aPos, 2));
    g.setAttribute('aLocal', mk(this.aLocal, 3));
    g.setAttribute('aSplat', mk(this.aSplat, 4));
    g.setAttribute('aStretch', mk(this.aStretch, 3));
    g.setAttribute('aGrow', mk(this.aGrow, 4));
    g.setAttribute('aW', mk(this.aW, 3));
    g.setAttribute('aMask', mk(this.aMask, 4));
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_QUADS * 4 * 3), 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9);
    this.geo = g;
    this.mat = new THREE.ShaderMaterial({
      vertexShader: PAINT_VS, fragmentShader: PAINT_FS,
      transparent: true, depthTest: false, depthWrite: false,
      // RGB: newest splat wins ("over"); A: max → union coverage that stays idempotent while a splat spreads
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendEquationAlpha: THREE.MaxEquation,
      blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
      toneMapped: false,
    });
    this.mesh = new THREE.Mesh(g, this.mat);
    this.mesh.frustumCulled = false;
    this.scene = new THREE.Scene();
    this.scene.add(this.mesh);
    // drying: subtract a few 1/255 steps of wetness (G) from the used part of the atlas, drawn in the same pass as the
    // splats so the mip chain is rebuilt once per frame
    const yTop = Math.min(1, ((this.usedHeight + 2) / S) * 2 - 1);
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, yTop, 0, -1, yTop, 0]), 3));
    dg.setIndex([0, 1, 2, 0, 2, 3]);
    this._dryU = { uDry: { value: 0 } };
    this.dryMesh = new THREE.Mesh(dg, new THREE.ShaderMaterial({
      uniforms: this._dryU,
      vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: 'precision highp float; uniform float uDry; void main() { gl_FragColor = vec4(0.0, uDry, 0.0, 0.0); }',
      transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
      blending: THREE.CustomBlending, blendEquation: THREE.ReverseSubtractEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
      blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    }));
    this.dryMesh.frustumCulled = false;
    this.dryMesh.renderOrder = -1;
    this.dryMesh.visible = false;
    this.scene.add(this.dryMesh);
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quads = 0;
    // region floods: one mesh, its geometry / material swapped per flood. Ink blends like a splat (RGB over, A max);
    // a wipe writes bare floor straight into the atlas.
    const fu = {
      uPoly: { value: new Float32Array(FLOOD_MAXV * 2) }, uPart: { value: new Int32Array(FLOOD_MAXP + 1) }, uParts: { value: 0 },
      uY: { value: new THREE.Vector2() }, uC: { value: new THREE.Vector2() }, uR: { value: new THREE.Vector2() }, uTeam: { value: 0 },
    };
    const fmat = (o) => new THREE.ShaderMaterial({ uniforms: fu, vertexShader: FLOOD_VS, fragmentShader: FLOOD_FS, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, ...o });
    this._floodInk = fmat({
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendEquationAlpha: THREE.MaxEquation,
      blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
    });
    this._floodWipe = fmat({ blending: THREE.NoBlending });
    this._floodU = fu;
    this._floodMesh = new THREE.Mesh(new THREE.BufferGeometry(), this._floodInk);
    this._floodMesh.frustumCulled = false;
    this._floodScene = new THREE.Scene();
    this._floodScene.add(this._floodMesh);
    this.clear();
  }

  clear() {
    const r = this.renderer;
    const prev = r.getRenderTarget();
    const cc = r.getClearColor(new THREE.Color()), ca = r.getClearAlpha();
    r.setRenderTarget(this.rt);
    r.setClearColor(0x000000, 0);
    r.clear(true, false, false);
    r.setRenderTarget(prev);
    r.setClearColor(cc, ca);
    this.grid.fill(0);
    this.counts[0] = this.counts[1] = 0;
    this.quads = 0;
    if (this.growing) this.growing.length = 0;
    if (this.rip) { for (let i = 0; i < RIP_N; i++) { this.rip[i * 4 + 3] = -99; this.ripP[i * 4 + 3] = 0.01; this._ripS[i] = 0; } }
    this._dryAcc = 0;
    this._floods.length = 0;
    for (const p of this._floodPrep.values()) p.geo.dispose();
    this._floodPrep.clear();
    // a fresh stage: no wave running, none held, the wave count starts over (every client clears at the same moments:
    // a match start, a practice stage swap)
    this.wipeK = 0; this._wipe = null; this._wipeC = null; this._held.length = 0; this.wipeFx.n = 0;
    this.version++;
  }

  // Camera position for ripple priorities (fxHooks calls it every frame; the vector is kept by reference).
  setView(pos) { this.viewPos = pos; }

  _kind(opts, radius, st, sAmt) {
    if (opts.kind !== undefined) { const k = K[opts.kind]; if (k !== undefined && (k !== K_ROLL || st)) return k; }
    if (st) return sAmt >= 1 ? K_LINE : K_SHOT;
    if (radius >= 1.9) return K_BOMB;
    if (radius >= 1.05) return K_BLAST;
    if (radius < 0.3) return K_DROP;
    return K_TRAIL;
  }

  // ------------------------------------------------------------ splat
  // center: Vector3, radius (m), team 0|1, opts: { stretch: Vector3 dir, stretchAmt, seed, kind, instant, cosmetic }
  // Returns the area (m²) newly claimed by `team` (for turf points / special gauge).
  splat(center, radius, team, opts = {}) {
    // online: other players' ghost rounds never paint (their owner's splats arrive instead); yours are recorded
    const nm = G.netm;
    const replay = !!(opts.replay || (nm && nm.applying));
    if (nm && !opts.cosmetic) {
      if (nm.mute > 0) return 0;
      if (!replay) { if (opts.seed === undefined) opts.seed = Math.random(); nm.recSplat(center, radius, team, opts); }
    }
    const seed = opts.seed ?? Math.random();
    const cosmetic = !!opts.cosmetic;
    // the clear-all-ink wave: which wave (wk) this splat comes after and where its front was (wr) when it was painted —
    // our own now, a replayed one's from its painter (_wipeGate may hold it back until our front gets there). Cells /
    // texels between wr and the front (now, and as it moves on while the splat spreads) are never drawn: the wave
    // already went over them for its painter.
    let wk = 0, wr = WIPE_DONE;
    if (!cosmetic && (this.wipeK || opts.wk)) {
      if (replay) {
        const gt = this._wipeGate(opts.wk | 0, opts.wr ?? WIPE_DONE);
        if (gt.hold) { this._hold(center, radius, team, opts); return 0; }
        wk = gt.wk; wr = gt.wr;
      } else { wk = this.wipeK; wr = this._wipe ? this._wipe.r : WIPE_DONE; }
    }
    this._mk = wk ? this._maskFor(wk, wr, this._mkBuf || (this._mkBuf = [0, 0, 0, 0])) : null;
    // Tower Command: the tower keeps its own ink (it moves; src/game/towerPaint.js)
    if (!cosmetic) G.match?.tower?.paint?.splat(center, radius, team, { seed });
    // sprout pods: their meters and their hedges' own ink (src/game/pods.js)
    if (!cosmetic) G.match?.pods?.onSplat(center, radius, team, opts);
    // [b5-stagehooks] stage modules: every splat; the painter's stage time (a replay's opts.et) for the block gate and the clip
    const SM = cosmetic ? null : G.match?.stage;
    if (SM) SM.onSplat(center, radius, team, opts);
    const BG = cosmetic ? null : this.blockGate, et = SM || BG || this.clip ? opts.et ?? (SM ? SM.t : 0) : 0;
    this._clip = !cosmetic && this.clip ? this.clip.clipAt(et) : -1e9;
    const st = opts.stretch;
    let sAmt = st ? (opts.stretchAmt ?? 1) : 0;
    const kind = cosmetic && opts.kind === undefined ? K_SPECK : this._kind(opts, radius, st, sAmt);
    if (kind === K_ROLL) sAmt = 0;      // the direction orients the band; no smear
    const reachK = REACH[kind];
    const reach = radius * Math.max(3.2, reachK + 1.4 * sAmt + 0.3);
    const ids = this.level.queryBlocks(center.x - reach, center.z - reach, center.x + reach, center.z + reach, this._qb || (this._qb = []));
    let claimed = 0;
    const entries = [];
    let wall = false;
    for (const bid of ids) {
      const b = this.level.blocks[bid];
      // quick reject by AABB distance
      if (center.x < b.aabbMin.x - reach || center.x > b.aabbMax.x + reach ||
          center.y < b.aabbMin.y - reach || center.y > b.aabbMax.y + reach ||
          center.z < b.aabbMin.z - reach || center.z > b.aabbMax.z + reach) continue;
      if (BG && !BG(b, et)) continue;   // [b5-stagehooks] (an era block that is absent or guarded at the painter's time)
      for (let fi = 0; fi < 6; fi++) {
        const fid = b.faces[fi];
        if (fid < 0) continue;
        const f = this.level.faces[fid];
        if (!f.atlas) continue;
        _rel.copy(center).sub(f.origin);
        const dn = _rel.dot(f.n);
        if (dn > radius || dn < -0.12) continue;
        const lu = _rel.dot(f.u), lv = _rel.dot(f.v);
        const rr = Math.sqrt(Math.max(0, radius * radius - dn * dn));
        const ext = rr * (reachK + 1.4 * sAmt);
        if (lu < -ext || lu > f.su + ext || lv < -ext - (f.wall ? rr * DRIP_REACH : 0) || lv > f.sv + ext) continue;
        // stretch / band direction projected into face space
        let sdu = 0, sdv = 0, sa = 0;
        if (st) {
          sdu = st.dot(f.u); sdv = st.dot(f.v);
          const l = Math.hypot(sdu, sdv);
          if (l > 0.2) { sdu /= l; sdv /= l; sa = sAmt * l; } else if (kind === K_ROLL) { sdu = 1; sdv = 0; } else { sdu = sdv = 0; }
        }
        if (!cosmetic) claimed += this._cpuSplat(f, lu, lv, rr, team, seed, sdu, sdv, sa, kind);
        entries.push(f, lu, lv, dn, sdu, sdv, sa);
        if (f.wall && rr > radius * 0.3) wall = true;
      }
    }
    if (entries.length) {
      // an older splat of the other team still spreading underneath this one finishes instantly, so the newer ink
      // always ends up on top (matching the gameplay grid)
      if (!cosmetic) {
        for (let i = this.growing.length - 1; i >= 0; i--) {
          const g = this.growing[i];
          if (g.team === team || g.kind === K_SPECK) continue;
          const dx = g.cx - center.x, dy = g.cy - center.y, dz = g.cz - center.z;
          const rs = (g.R * (g.dripDur ? DRIP_REACH : REACH[g.kind]) + radius * REACH[kind]);
          if (dx * dx + dy * dy + dz * dz < rs * rs) { this._emitGrowth(g, 3, 1, false); this.growing.splice(i, 1); }
        }
      }
      const drips = wall && kind !== K_SPECK && kind !== K_ROLL ? 1 : 0;
      const g = {
        entries, R: radius, team, seed, kind, age: 0, wk, wr, wcx: this._wipeC ? this._wipeC.cx : 0, wcz: this._wipeC ? this._wipeC.cz : 0,
        et: this.clip && !cosmetic ? et : undefined,   // [b5-stagehooks] (the clip is re-evaluated as it spreads)
        // the body floods out in ≈ 0.1–0.3 s (bigger = heavier), droplets land up to ~1.3× that later; drips run on
        dur: kind === K_SPECK ? 0.05 : 0.085 + Math.min(0.22, radius * 0.075),
        dripDur: drips ? 1.1 + Math.min(2.2, radius * 1.5) : 0,
        cx: center.x, cy: center.y, cz: center.z,
      };
      if (opts.instant) this._emitGrowth(g, 3, 1, false);
      else this.growing.push(g);
      this._mk = null;
      if (!cosmetic && radius >= 0.15 && !this._rippledNear(center, radius)) {
        // a ripple runs out across the wet ink from the impact (one per cluster: a roller stroke or a burst of trail
        // drips does not turn the ink into rain)
        this.ripple(center, 0.0038 + 0.0036 * Math.min(radius, 3), 0.1 + 0.05 * Math.min(radius, 3), 0.85 + 0.35 * Math.min(radius, 3), 0.55 + 0.2 * Math.min(radius, 3));
      }
    }
    this._mk = null;
    this._clip = -1e9;
    return claimed;
  }

  // Cosmetic micro-splat where a flying droplet lands: GPU only (finer than the gameplay grid, never claims turf).
  speck(center, radius, team, seed = Math.random()) {
    return this.splat(center, Math.min(radius, 0.12), team, { seed, kind: 'speck', cosmetic: true });
  }

  // A ripple of at least this size already started nearby within the last ~0.16 s?
  _rippledNear(pos, radius) {
    const R = this.rip, P = this.ripP, reach = 0.55 + radius * 0.6;
    for (let i = 0; i < RIP_N; i++) {
      const o = i * 4, age = this.clock - R[o + 3];
      if (age < 0 || age > 0.16 || P[o] < 0.0036 + 0.0036 * Math.min(radius, 3) * 0.7) continue;
      const dx = R[o] - pos.x, dy = R[o + 1] - pos.y, dz = R[o + 2] - pos.z;
      if (dx * dx + dy * dy + dz * dz < reach * reach) return true;
    }
    return false;
  }

  // A ripple across the ink surface at pos (only visible where there is ink). amp in metres (≈ 0.003–0.015),
  // wavelength in metres, speed m/s, life s. Keeps the RIP_N most important live ripples (size × nearness × life left).
  ripple(pos, amp = 0.006, wavelength = 0.14, speed = 1.2, life = 0.7) {
    let d2 = 0;
    const vp = this.viewPos;
    if (vp) {
      const dx = pos.x - vp.x, dy = pos.y - vp.y, dz = pos.z - vp.z;
      d2 = dx * dx + dy * dy + dz * dz;
      if (d2 > 38 * 38) return;
    }
    const score = amp / (1 + d2 * 0.012);
    let best = -1, bestS = Infinity;
    for (let i = 0; i < RIP_N; i++) {
      const o = i * 4;
      const age = this.clock - this.rip[o + 3], L = this.ripP[o + 3];
      if (age >= L || age < -1) { best = i; bestS = -1; break; }
      const s = this._ripS[i] * (1 - age / L);
      if (s < bestS) { bestS = s; best = i; }
    }
    if (best < 0 || bestS > score) return;
    const o = best * 4;
    this.rip[o] = pos.x; this.rip[o + 1] = pos.y; this.rip[o + 2] = pos.z; this.rip[o + 3] = this.clock;
    this.ripP[o] = amp; this.ripP[o + 1] = wavelength; this.ripP[o + 2] = speed; this.ripP[o + 3] = life;
    this._ripS[best] = score;
  }

  // Draw one growth step of a splat. tn = age / spread time (the body spreads over [0,1], droplets + spatter land up to
  // ≈ 1.7), dT = drip progress 0..1, dripOnly = the body is done: redraw only the running drips on walls. The atlas
  // alpha is max-blended and the colour "over" blended with the same shape, so redrawing every frame is idempotent.
  _emitGrowth(g, tn, dT, dripOnly) {
    const E = g.entries, R = g.R, kind = g.kind;
    const reachK = REACH[kind];
    // (a splat spreading while a wave runs: never redraw what the front has passed since it was painted)
    this._mk = g.wk ? this._maskFor(g.wk, g.wr, this._mkBuf || (this._mkBuf = [0, 0, 0, 0]), g.wcx, g.wcz) : null;
    this._clip = g.et !== undefined && this.clip ? this.clip.clipAt(g.et) : -1e9;   // [b5-stagehooks]
    for (let i = 0; i < E.length; i += 7) {
      const f = E[i], lu = E[i + 1], lv = E[i + 2], dn = E[i + 3], sdu = E[i + 4], sdv = E[i + 5], sa = E[i + 6];
      if (dn >= R) continue;
      const rr = Math.sqrt(R * R - dn * dn);
      if (dripOnly) {
        if (!f.wall || rr < R * 0.3) continue;
        this._pushQuad(f, lu - rr * 0.95, lu + rr * 0.95, lv - rr * DRIP_REACH, lv - rr * 0.3, lu, lv, dn, R, g.team, g.seed, kind, sdu, sdv, sa, tn, dT, 1);
      } else {
        const ext = rr * (reachK + 1.4 * sa);
        const down = f.wall && g.dripDur ? rr * DRIP_REACH : 0;
        this._pushQuad(f, lu - ext, lu + ext, lv - Math.max(ext, down), lv + ext, lu, lv, dn, R, g.team, g.seed, kind, sdu, sdv, sa, tn, dT, 0);
      }
    }
    this._mk = null;
    this._clip = -1e9;
  }

  _cpuSplat(f, lu, lv, r, team, seed, sdu, sdv, sa, kind) {
    if (r <= 0.02) return 0;
    const val = team + 1;
    const roll = kind === K_ROLL;
    const ext = roll ? r * (Math.hypot(BAND_L, BAND_W) + BAND_R + 0.05) : r * (1 + sa) * WOB_MAX;
    const i0 = Math.max(0, Math.floor((lu - ext) / f.cu)), i1 = Math.min(f.nu - 1, Math.floor((lu + ext) / f.cu));
    const j0 = Math.max(0, Math.floor((lv - ext) / f.cv)), j1 = Math.min(f.nv - 1, Math.floor((lv + ext) / f.cv));
    if (i1 < i0 || j1 < j0) return 0;
    let claimed = 0;
    const cellA = f.cu * f.cv;
    const mk = this._mk && this._mk[3] > this._mk[2] ? this._mk : null;   // (the wipe wave already went over (r0, r1])
    const CL = f.clipOn && this.clip ? this.clip : null, cy = this._clip;   // [b5-stagehooks] (no ink below the clip)
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        if (mk) {
          const s = (i + 0.5) * f.cu, t = (j + 0.5) * f.cv;
          const d = Math.hypot(f.origin.x + f.u.x * s + f.v.x * t - mk[0], f.origin.z + f.u.z * s + f.v.z * t - mk[1]);
          if (d > mk[2] && d <= mk[3]) continue;
        }
        if (CL) {
          const s = (i + 0.5) * f.cu, t = (j + 0.5) * f.cv, x = f.origin.x + f.u.x * s + f.v.x * t, z = f.origin.z + f.u.z * s + f.v.z * t;
          if (f.origin.y + f.u.y * s + f.v.y * t < cy && CL.inside(x, z)) continue;
        }
        let px = (i + 0.5) * f.cu - lu, py = (j + 0.5) * f.cv - lv;
        if (roll) {
          const qa = Math.abs(px * sdu + py * sdv) - r * BAND_L, qb = Math.abs(-px * sdv + py * sdu) - r * BAND_W;
          const sd = Math.hypot(Math.max(qa, 0), Math.max(qb, 0)) + Math.min(Math.max(qa, qb), 0) - r * BAND_R;
          if (sd > -0.03 * r) continue;
        } else {
          if (sa > 0) {
            const a = px * sdu + py * sdv;
            const qx = px - a * sdu, qy = py - a * sdv;
            const s = a > 0 ? 1 + sa : 1 + 0.25 * sa;
            px = qx + sdu * (a / s); py = qy + sdv * (a / s);
          }
          const d = Math.hypot(px, py);
          if (d > r * WOB_MAX) continue;
          if (d / (r * blobWobble(Math.atan2(py, px), seed)) > 0.97) continue;
        }
        const k = f.grid + j * f.nu + i;
        const prev = this.grid[k];
        if (prev === val) continue;
        this.grid[k] = val;
        claimed += cellA;
        if (f.turf && !this.dead[k]) {
          if (prev) this.counts[prev - 1]--;
          this.counts[team]++;
        }
      }
    }
    if (claimed > 0) this.version++;
    return claimed;
  }

  _pushQuad(f, u0, u1, v0, v1, lu, lv, dn, R, team, seed, kind, sdu, sdv, sa, tn, dT, dripOnly) {
    if (this.quads >= MAX_QUADS) this._drawQuads();
    const a = f.atlas, S = this.size;
    const padM = (a.pad - 0.5) / a.ppm;
    u0 = Math.max(-padM, u0); u1 = Math.min(f.su + padM, u1);
    v0 = Math.max(-padM, v0); v1 = Math.min(f.sv + padM, v1);
    if (u1 <= u0 || v1 <= v0) return;
    const q = this.quads++;
    const flags = (f.wall ? 1 : 0) + 2 * kind;
    const mk = this._mk;
    for (let c = 0; c < 4; c++) {
      const cu = c === 1 || c === 2 ? u1 : u0, cv = c >= 2 ? v1 : v0;
      const vi = q * 4 + c;
      this.aW[vi * 3] = f.origin.x + f.u.x * cu + f.v.x * cv; this.aW[vi * 3 + 1] = f.origin.y + f.u.y * cu + f.v.y * cv; this.aW[vi * 3 + 2] = f.origin.z + f.u.z * cu + f.v.z * cv;
      if (mk) { this.aMask[vi * 4] = mk[0]; this.aMask[vi * 4 + 1] = mk[1]; this.aMask[vi * 4 + 2] = mk[2]; this.aMask[vi * 4 + 3] = mk[3]; }
      else { this.aMask[vi * 4 + 2] = 0; this.aMask[vi * 4 + 3] = 0; }
      if (this.aClip) this.aClip[vi] = f.clipOn ? this._clip : -1e9;   // [b5-stagehooks]
      const px = a.x + a.pad + cu * a.ppm, py = a.y + a.pad + cv * a.ppm;
      this.aPos[vi * 2] = (px / S) * 2 - 1;
      this.aPos[vi * 2 + 1] = (py / S) * 2 - 1;
      this.aLocal[vi * 3] = cu - lu; this.aLocal[vi * 3 + 1] = cv - lv; this.aLocal[vi * 3 + 2] = dn;
      this.aSplat[vi * 4] = R; this.aSplat[vi * 4 + 1] = team; this.aSplat[vi * 4 + 2] = seed; this.aSplat[vi * 4 + 3] = flags;
      this.aStretch[vi * 3] = sdu; this.aStretch[vi * 3 + 1] = sdv; this.aStretch[vi * 3 + 2] = sa;
      this.aGrow[vi * 4] = tn; this.aGrow[vi * 4 + 1] = dT; this.aGrow[vi * 4 + 2] = dripOnly; this.aGrow[vi * 4 + 3] = 0;
    }
  }

  // Advance spreading / dripping splats, dry the ink a little, and draw everything into the atlas. Call once per frame.
  flush(dt = 1 / 60) {
    this.clock += dt;
    this.frame++;
    for (let i = 0; i < this.growing.length; i++) {
      const g = this.growing[i];
      g.age += dt;
      const tn = g.age / g.dur;
      const td = g.dripDur ? Math.min(1, g.age / g.dripDur) : 1;
      const dT = 1 - Math.pow(1 - td, 2.2);            // viscous: runs fast, then creeps to a stop
      const bodyDone = tn >= 1.75;
      if (bodyDone && td >= 1) {
        this._emitGrowth(g, 3, 1, !!g.dripDur);
        this.growing[i] = this.growing[this.growing.length - 1]; this.growing.pop(); i--;
        continue;
      }
      this._emitGrowth(g, Math.min(tn, 3), dT, bodyDone);
    }
    // drying: 1/255 of wetness every 1/40 s (≈ 6.4 s from landing to dry), applied in steps of ≥ 2
    this._dryAcc += dt;
    const n = Math.floor(this._dryAcc * 40);
    if (n >= 2) {
      const k = Math.min(n, 12);
      this._dryAcc -= k / 40;
      this._dryU.uDry.value = k / 255;
      this.dryMesh.visible = true;
    }
    const floods = this._floods.length > 0, wipe = !!this._wipe;
    if (floods || wipe) { if (floods) this._floodSettle(); this.texture.generateMipmaps = false; }   // (one mip rebuild: after the floods / the wave)
    this._drawQuads();
    this.dryMesh.visible = false;
    if (floods) { this.texture.generateMipmaps = !wipe; this._floodStep(dt); }
    if (wipe) { this.texture.generateMipmaps = true; this._wipeStep(dt); }
    else this.wipeFx.n = 0;
    if (this._held.length) this._releaseHeld();
  }

  // ------------------------------------------------------------ region floods (Zone Control)
  // flood(region, team, { center: [x, z], y, reach, dur = 0.5, ease = 'out' | 'linear' }): ink a whole region with one
  // team's ink (team 0 | 1), or wipe it back to bare floor (team -1), as a front running out from `center` (radius =
  // reach · ease(t / dur); everything left is done at dur, so dur 0 = at once). region = { cells: Int32Array (its live
  // turf cells), polys: [[[x, z], …], …] (outlines), y0, y1 }. The atlas is flooded with the same test the cells were
  // picked with (inside an outline, y0 ≤ y ≤ y1), and the gameplay grid, the coverage counts and `version` (→ the
  // minimap) change with it as the front passes each cell, so what you see and what you swim in agree. Nobody is
  // credited: no turf points, no special gauge. A new flood of a region replaces one still running there.
  flood(region, team, opts = {}) {
    if (!region || !region.cells || !region.cells.length) return null;
    const c = opts.center || [0, 0];
    const P = this._floodPrepFor(region, c[0], c[1]);
    for (let k = this._floods.length - 1; k >= 0; k--) if (this._floods[k].region === region) this._floods.splice(k, 1);
    const J = {
      region, prep: P, team: team === 0 || team === 1 ? team : -1, t: 0, dur: Math.max(0, +opts.dur || 0), r: -1, i: 0,
      reach: Math.max(0.1, opts.reach ?? (P.n ? P.dist[P.n - 1] + 0.2 : 1)), ease: opts.ease === 'linear' ? 'linear' : 'out', cx: c[0], cz: c[1],
    };
    if (opts.dur == null) J.dur = 0.5;
    this._floods.push(J);
    // a flood sends a swell out across the fresh ink, riding the front
    if (J.team >= 0 && opts.y != null) this.ripple(_rel.set(c[0], opts.y, c[1]), 0.03, 0.45, J.reach / Math.max(0.2, J.dur) * 0.85, Math.max(0.6, J.dur * 1.6));
    return J;
  }

  // a region's cells (live turf only) sorted by distance from the front's centre, plus its atlas quads + outlines
  _floodPrepFor(region, cx, cz) {
    let P = this._floodPrep.get(region);
    if (P && P.cx === cx && P.cz === cz) return P;
    const faces = this.paintFaces, cells = region.cells;
    const faceOf = (k) => { let a = 0, b = faces.length - 1; while (a < b) { const m = (a + b + 1) >> 1; if (faces[m].grid <= k) a = m; else b = m - 1; } return faces[a]; };
    const ids = [], ds = [], box = new Map();
    for (let n = 0; n < cells.length; n++) {
      const k = cells[n], f = faceOf(k);
      if (!f || !f.atlas || k < f.grid || k >= f.grid + f.nu * f.nv) continue;
      const l = k - f.grid, i = l % f.nu, j = (l - i) / f.nu;
      const b = box.get(f);
      if (!b) box.set(f, [i, i, j, j]);
      else { if (i < b[0]) b[0] = i; if (i > b[1]) b[1] = i; if (j < b[2]) b[2] = j; if (j > b[3]) b[3] = j; }
      if (!f.turf || this.dead[k]) continue;                       // (counts only ever track live turf cells)
      const s = (i + 0.5) * f.cu, t = (j + 0.5) * f.cv;
      ids.push(k); ds.push(Math.hypot(f.origin.x + f.u.x * s + f.v.x * t - cx, f.origin.z + f.u.z * s + f.v.z * t - cz));
    }
    const ord = ids.map((_, n) => n).sort((a, b) => ds[a] - ds[b]);
    if (!P) {
      // one quad per face: the region's cell bounds on it + a cell (the outline can run up to half a cell past them),
      // clamped to the face's atlas rect incl. its padding (like a splat)
      const pos = [], w = [], index = [], S = this.size;
      for (const [f, b] of box) {
        const a = f.atlas, padM = (a.pad - 0.5) / a.ppm;
        const u0 = Math.max(-padM, (b[0] - 1) * f.cu), u1 = Math.min(f.su + padM, (b[1] + 2) * f.cu);
        const v0 = Math.max(-padM, (b[2] - 1) * f.cv), v1 = Math.min(f.sv + padM, (b[3] + 2) * f.cv);
        const base = pos.length / 2;
        for (const [u, v] of [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]) {
          pos.push(((a.x + a.pad + u * a.ppm) / S) * 2 - 1, ((a.y + a.pad + v * a.ppm) / S) * 2 - 1);
          w.push(f.origin.x + f.u.x * u + f.v.x * v, f.origin.y + f.u.y * u + f.v.y * v, f.origin.z + f.u.z * u + f.v.z * v);
        }
        index.push(base, base + 1, base + 2, base, base + 2, base + 3);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('aPos', new THREE.Float32BufferAttribute(pos, 2));
      geo.setAttribute('aW', new THREE.Float32BufferAttribute(w, 3));
      geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array((pos.length / 2) * 3), 3));
      geo.setIndex(index);
      geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9);
      const poly = new Float32Array(FLOOD_MAXV * 2), part = new Int32Array(FLOOD_MAXP + 1);
      let nv = 0, np = 0;
      for (const p of region.polys || []) {
        if (!p || p.length < 3) continue;
        if (np >= FLOOD_MAXP || nv + p.length > FLOOD_MAXV) { console.warn('[paint] flood region outline too detailed; extra parts ignored'); break; }
        part[np++] = nv;
        for (const [x, z] of p) { poly[nv * 2] = x; poly[nv * 2 + 1] = z; nv++; }
      }
      part[np] = nv;
      P = { geo, poly, part, parts: np, y0: region.y0 ?? -2, y1: region.y1 ?? 6 };
      this._floodPrep.set(region, P);
    }
    P.cx = cx; P.cz = cz;
    P.order = Int32Array.from(ord, (n) => ids[n]); P.dist = Float32Array.from(ord, (n) => ds[n]); P.n = ord.length;
    return P;
  }

  // splats still spreading where a front is running finish now, so they are drawn before (under) the flood and never
  // keep growing over it after the front has passed (the grid already holds their final shape)
  _floodSettle() {
    for (let i = this.growing.length - 1; i >= 0; i--) {
      const g = this.growing[i];
      for (const J of this._floods) {
        const reach = J.reach + g.R * (g.dripDur ? DRIP_REACH : REACH[g.kind]) + 0.5;
        const dx = g.cx - J.cx, dz = g.cz - J.cz;
        if (dx * dx + dz * dz < reach * reach && g.cy > J.prep.y0 - 4 && g.cy < J.prep.y1 + 4) {
          this._emitGrowth(g, 3, 1, false);
          this.growing[i] = this.growing[this.growing.length - 1]; this.growing.pop();
          break;
        }
      }
    }
  }

  // advance every front: flip the cells it reached (grid + counts), then draw the band it crossed into the atlas
  _floodStep(dt) {
    const r = this.renderer, prev = r.getRenderTarget(), ac = r.autoClear, U = this._floodU;
    r.autoClear = false;
    r.setRenderTarget(this.rt);
    let drew = false, changed = false;
    for (let k = 0; k < this._floods.length; k++) {
      const J = this._floods[k], P = J.prep;
      J.t += dt;
      const done = J.t >= J.dur, x = done ? 1 : J.t / J.dur;
      const rad = done ? 1e9 : J.reach * (J.ease === 'linear' ? x : 1 - (1 - x) * (1 - x));
      const val = J.team + 1;
      while (J.i < P.n && P.dist[J.i] <= rad) {
        const c = P.order[J.i++], was = this.grid[c];
        if (was === val) continue;
        this.grid[c] = val;
        if (was) this.counts[was - 1]--;
        if (val) this.counts[val - 1]++;
        changed = true;
      }
      if (rad > J.r && P.parts > 0) {
        U.uPoly.value = P.poly; U.uPart.value = P.part; U.uParts.value = P.parts;
        U.uY.value.set(P.y0, P.y1); U.uC.value.set(J.cx, J.cz); U.uR.value.set(J.r, rad); U.uTeam.value = J.team;
        this._floodMesh.geometry = P.geo;
        this._floodMesh.material = J.team < 0 ? this._floodWipe : this._floodInk;
        r.render(this._floodScene, this.cam);
        drew = true;
      }
      J.r = rad;
      if (done) this._floods.splice(k--, 1);
    }
    if (!drew) { this._floodMesh.visible = false; r.render(this._floodScene, this.cam); this._floodMesh.visible = true; }   // (mips)
    r.setRenderTarget(prev);
    r.autoClear = ac;
    if (changed) this.version++;
  }

  _drawQuads() {
    if (!this.quads && !this.dryMesh.visible) return;
    const g = this.geo, n = this.quads * 4;
    if (n) {
      for (const name of this.aClip ? QUAD_ATTRS_CLIP : QUAD_ATTRS) {   // [b5-stagehooks] (+ aClip with a clip)
        const at = g.attributes[name];
        at.clearUpdateRanges(); at.addUpdateRange(0, n * at.itemSize); at.needsUpdate = true;
      }
    }
    g.setDrawRange(0, this.quads * 6);
    this.mesh.visible = this.quads > 0;
    const r = this.renderer;
    const prev = r.getRenderTarget();
    const ac = r.autoClear;
    r.autoClear = false;
    r.setRenderTarget(this.rt);
    r.render(this.scene, this.cam);
    r.setRenderTarget(prev);
    r.autoClear = ac;
    this.quads = 0;
    this.dryMesh.visible = false;
  }

  // ------------------------------------------------------------ the clear-all-ink wave (practice)
  // startWipe({ k, cx, cz, dur = 1.6, reach }): wave number k (each client counts the same waves: the host numbers them)
  // runs a front out from (cx, cz) over every paintable surface, radius = reach · ease(t / dur) measured flat (xz), and
  // everything it passes is wiped: the gameplay grid cell by cell (cell centre inside the front) and the atlas texel by
  // texel, so what you see and what you swim in agree. Ink painted behind the front stays; ink ahead of it goes when
  // the front gets there. reach defaults to the farthest cell + 0.5 m (the whole stage).
  //
  // Online, every splat record carries its painter's wave tag (wipeTag(): [wave, front radius then], WIPE_DONE once
  // over). Replaying it here (_wipeGate): if our own front for that wave hasn't got as far yet (or the wave hasn't
  // started here), the splat waits (_held) until it has; then it is drawn with the ring between its painter's front and
  // ours masked off (the wave already passed there for the painter). A splat from before a wave its painter hadn't heard
  // of yet is "before" it. So each cell ends up cleared or inked by the same rule on every screen, whatever order the
  // wave and the splats arrive in.
  startWipe({ k, cx = 0, cz = 0, dur = 1.6, reach } = {}) {
    k = k | 0;
    if (!(k > this.wipeK)) return null;
    if (this._wipe) this._wipeFinish();
    const P = this._wipePrep(cx, cz);
    this.wipeK = k;
    this._wipeC = { k, cx, cz };
    const W = this._wipe = { k, cx, cz, dur: Math.max(0.05, +dur || 1.6), reach: Math.max(1, reach ?? P.maxD + 0.5), t: 0, r: -1e-3, b: 0, prep: P };
    return W;
  }
  /** This screen's front for wave k: -1 not started here, its radius while running, WIPE_DONE once over. */
  wipeFront(k) {
    if (k > this.wipeK) return -1;
    if (this._wipe && this._wipe.k === k) return this._wipe.r;
    return WIPE_DONE;
  }
  /** The tag a splat painted here now carries: [wave, front] (null before any wave). */
  wipeTag() { return this.wipeK ? [this.wipeK, this._wipe ? this._wipe.r : WIPE_DONE] : null; }
  /** A late joiner takes the host's wave count (and the last wave's centre) with its copy of the turf. */
  setWipeState(k, cx = 0, cz = 0) { this.wipeK = Math.max(0, k | 0); this._wipe = null; this._wipeC = this.wipeK ? { k: this.wipeK, cx, cz } : null; }
  get wiping() { return !!this._wipe; }

  _wipeGate(K, rk) {
    const L = this.wipeK;
    if (K > L) return { hold: true };          // its painter saw a wave start that hasn't started here yet
    if (K < L || !K) { K = L; rk = -1; }        // painted before our latest wave: everything it covers goes
    if (!K) return { wk: 0, wr: WIPE_DONE };
    if (this.wipeFront(K) < rk) return { hold: true };   // our front hasn't reached where its painter's was
    return { wk: K, wr: rk };
  }
  _maskFor(wk, wr, out, cx, cz) {
    const f = this.wipeFront(wk);
    if (!(f > wr) || f < 0) return null;
    out[0] = cx ?? (this._wipeC ? this._wipeC.cx : 0); out[1] = cz ?? (this._wipeC ? this._wipeC.cz : 0); out[2] = wr; out[3] = f;
    return out;
  }
  _hold(c, radius, team, opts) {
    if (this._held.length >= 600) this._held.shift();   // (never pile up)
    const o = { ...opts, replay: 1 };
    if (o.stretch) o.stretch = o.stretch.clone();
    this._held.push({ c: c.clone(), radius, team, opts: o, t: this.clock });
  }
  _releaseHeld() {
    const H = this._held;
    this._held = [];
    for (const h of H) {
      // waited 4 s for a wave that never started here (its event was lost): paint it as it stands
      if (this.clock - h.t > 4 && (h.opts.wk | 0) > this.wipeK) { h.opts.wk = this.wipeK; h.opts.wr = WIPE_DONE; }
      this.splat(h.c, h.radius, h.team, h.opts);   // (holds again if it still isn't due)
    }
  }

  // every cell's flat distance from the centre, and the cells counting-sorted into 0.25 m distance buckets
  _wipePrep(cx, cz) {
    const n = this.grid.length, dist = new Float32Array(n);
    let maxD = 0;
    for (const f of this.paintFaces) {
      const ox = f.origin.x - cx, oz = f.origin.z - cz;
      for (let j = 0; j < f.nv; j++) {
        const t = (j + 0.5) * f.cv, bx = ox + f.v.x * t, bz = oz + f.v.z * t;
        let k = f.grid + j * f.nu;
        for (let i = 0; i < f.nu; i++, k++) {
          const s = (i + 0.5) * f.cu, d = Math.hypot(bx + f.u.x * s, bz + f.u.z * s);
          dist[k] = d;
          if (d > maxD) maxD = d;
        }
      }
    }
    const nb = Math.ceil(maxD / WIPE_BUCKET) + 2;
    const start = new Uint32Array(nb + 1);
    for (let k = 0; k < n; k++) start[((dist[k] / WIPE_BUCKET) | 0) + 1]++;
    for (let b = 1; b <= nb; b++) start[b] += start[b - 1];
    const at = start.slice(0, nb), order = new Uint32Array(n);
    for (let k = 0; k < n; k++) order[at[(dist[k] / WIPE_BUCKET) | 0]++] = k;
    return { dist, order, start, nb, maxD };
  }

  // advance the front: clear the cells it reached (grid + counts), sample some inked ones for the steam, then draw the
  // band it crossed this frame into the atlas
  _wipeStep(dt) {
    const W = this._wipe;
    if (!W) return;
    W.t += dt;
    const x = Math.min(1, W.t / W.dur);
    const r1 = x >= 1 ? WIPE_DONE : W.reach * (1 - Math.pow(1 - x, 1.7));
    const r0 = W.r;
    const P = W.prep, grid = this.grid, live = this.live, dist = P.dist, order = P.order, start = P.start;
    const fx = this.wipeFx, cap = fx.team.length;
    fx.n = 0;
    let seen = 0, changed = false;
    const clearCell = (k) => {
      const v = grid[k];
      if (!v) return;
      grid[k] = 0;
      if (live[k]) this.counts[v - 1]--;
      changed = true;
      // reservoir sample of this frame's inked cells (positions are worked out below, only for the ones kept)
      seen++;
      const slot = fx.n < cap ? fx.n++ : (Math.random() * seen) | 0;
      if (slot < cap) { fx.pos[slot * 3] = k; fx.team[slot] = v - 1; }
    };
    for (; W.b < P.nb; W.b++) {
      const lo = W.b * WIPE_BUCKET;
      if (lo > r1) break;
      const a = start[W.b], z = start[W.b + 1];
      if ((W.b + 1) * WIPE_BUCKET <= r1) { for (let q = a; q < z; q++) clearCell(order[q]); continue; }
      for (let q = a; q < z; q++) { const k = order[q]; if (dist[k] <= r1) clearCell(k); }   // the bucket the front is in
      break;
    }
    fx.cleared = seen;
    // the sampled cells' world positions (just off the surface)
    for (let q = 0; q < fx.n; q++) {
      const k = fx.pos[q * 3], f = this._faceOfCell(k);
      if (!f) { fx.pos[q * 3] = fx.pos[q * 3 + 1] = fx.pos[q * 3 + 2] = 0; continue; }
      const l = k - f.grid, i = l % f.nu, j = (l - i) / f.nu, s = (i + 0.5) * f.cu, t = (j + 0.5) * f.cv;
      fx.pos[q * 3] = f.origin.x + f.u.x * s + f.v.x * t + f.n.x * 0.05;
      fx.pos[q * 3 + 1] = f.origin.y + f.u.y * s + f.v.y * t + f.n.y * 0.05;
      fx.pos[q * 3 + 2] = f.origin.z + f.u.z * s + f.v.z * t + f.n.z * 0.05;
    }
    // GPU: wipe the band (r0, r1] on every face's atlas rect
    this._wipeBand(W.cx, W.cz, r0, r1);
    W.r = r1;
    if (changed) this.version++;
    if (x >= 1) this._wipe = null;
  }
  // a wave still running when another starts (or the stage is cleared) finishes at once
  _wipeFinish() { const W = this._wipe; if (!W) return; W.t = W.dur; this._wipeStep(0); this._wipe = null; }

  _faceOfCell(k) {
    const faces = this.paintFaces;
    let a = 0, b = faces.length - 1;
    while (a < b) { const m = (a + b + 1) >> 1; if (faces[m].grid <= k) a = m; else b = m - 1; }
    const f = faces[a];
    return f && k >= f.grid && k < f.grid + f.nu * f.nv ? f : null;
  }

  _wipeBand(cx, cz, r0, r1) {
    if (!this._wipeMesh) {
      // every paintable face's whole atlas rect (padding included) as one quad, carrying its world position
      const pos = [], w = [], index = [], S = this.size;
      for (const f of this.paintFaces) {
        const a = f.atlas;
        if (!a) continue;
        const padM = (a.pad - 0.5) / a.ppm, base = pos.length / 2;
        for (const [u, v] of [[-padM, -padM], [f.su + padM, -padM], [f.su + padM, f.sv + padM], [-padM, f.sv + padM]]) {
          pos.push(((a.x + a.pad + u * a.ppm) / S) * 2 - 1, ((a.y + a.pad + v * a.ppm) / S) * 2 - 1);
          w.push(f.origin.x + f.u.x * u + f.v.x * v, f.origin.y + f.u.y * u + f.v.y * v, f.origin.z + f.u.z * u + f.v.z * v);
        }
        index.push(base, base + 1, base + 2, base, base + 2, base + 3);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('aPos', new THREE.Float32BufferAttribute(pos, 2));
      geo.setAttribute('aW', new THREE.Float32BufferAttribute(w, 3));
      geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array((pos.length / 2) * 3), 3));
      geo.setIndex(index);
      geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9);
      const mat = new THREE.ShaderMaterial({
        uniforms: { uC: { value: new THREE.Vector2() }, uR: { value: new THREE.Vector2() } },
        vertexShader: 'attribute vec2 aPos; attribute vec3 aW; varying vec3 vW; void main() { vW = aW; gl_Position = vec4(aPos, 0.0, 1.0); }',
        fragmentShader: 'precision highp float; uniform vec2 uC; uniform vec2 uR; varying vec3 vW; void main() { float r = length(vW.xz - uC); if (r <= uR.x || r > uR.y) discard; gl_FragColor = vec4(0.0); }',
        transparent: true, depthTest: false, depthWrite: false, toneMapped: false, blending: THREE.NoBlending,
      });
      this._wipeMesh = new THREE.Mesh(geo, mat);
      this._wipeMesh.frustumCulled = false;
      this._wipeScene = new THREE.Scene();
      this._wipeScene.add(this._wipeMesh);
    }
    const U = this._wipeMesh.material.uniforms;
    U.uC.value.set(cx, cz); U.uR.value.set(r0, Math.min(r1, 1e6));
    const r = this.renderer, prev = r.getRenderTarget(), ac = r.autoClear;
    r.autoClear = false;
    r.setRenderTarget(this.rt);
    r.render(this._wipeScene, this.cam);
    r.setRenderTarget(prev);
    r.autoClear = ac;
  }

  // ------------------------------------------------------------ the turf as data (a late joiner's copy)
  // exportGrid() → { n, v: 1, d: base64 } — the gameplay grid run-length encoded: each run a varint (length << 2 | value)
  // importGrid(data) → bool: replaces this grid (and the counts) with it and stamps it into the atlas — a rounded box
  // over each run of a row, a little oversized so neighbouring rows merge into one sheet of ink (it reads as ink laid
  // a while ago: the gameplay edge is exact, the drawn one blockier than a live splat's)
  exportGrid() {
    const g = this.grid, n = g.length, bytes = [];
    const put = (x) => { while (x >= 0x80) { bytes.push((x & 0x7f) | 0x80); x = Math.floor(x / 128); } bytes.push(x); };
    for (let k = 0; k < n;) {
      const v = g[k];
      let e = k + 1;
      while (e < n && g[e] === v) e++;
      put((e - k) * 4 + v);
      k = e;
    }
    let bin = '';
    const u8 = Uint8Array.from(bytes);
    for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return { v: 1, n, d: btoa(bin) };
  }
  importGrid(data) {
    if (!data || data.v !== 1 || data.n !== this.grid.length || typeof data.d !== 'string') return false;
    const bin = atob(data.d), g = this.grid, n = g.length;
    let k = 0, x = 0, mul = 1;
    for (let i = 0; i < bin.length && k <= n; i++) {
      const b = bin.charCodeAt(i);
      x += (b & 0x7f) * mul;
      if (b & 0x80) { mul *= 128; continue; }
      const v = x % 4, len = Math.floor(x / 4);
      if (k + len > n || v > 2) return false;
      g.fill(v, k, k + len);
      k += len; x = 0; mul = 1;
    }
    if (k !== n) return false;
    this._clip = -1e9;   // [b5-stagehooks] (the host's copy already has no ink under a clip)
    this.counts[0] = this.counts[1] = 0;
    for (let i = 0; i < n; i++) if (g[i] && this.live[i]) this.counts[g[i] - 1]++;
    this.version++;
    // the atlas: one stamp per run of inked cells along a row
    const ex = 0.07, rr = 0.09;
    for (const f of this.paintFaces) {
      if (!f.atlas) continue;
      for (let j = 0; j < f.nv; j++) {
        const row = f.grid + j * f.nu;
        for (let i = 0; i < f.nu;) {
          const v = g[row + i];
          if (!v) { i++; continue; }
          let e = i + 1;
          while (e < f.nu && g[row + e] === v) e++;
          const u0 = i * f.cu - ex, u1 = e * f.cu + ex, v0 = j * f.cv - ex, v1 = (j + 1) * f.cv + ex;
          const lu = (u0 + u1) / 2, lv = (v0 + v1) / 2;
          this._pushQuad(f, u0 - rr, u1 + rr, v0 - rr, v1 + rr, lu, lv, 0, 1, v - 1, ((row + i) * 0.6180339) % 1, K_RECT, (u1 - u0) / 2 - rr, (v1 - v0) / 2 - rr, rr, 3, 1, 0);
          i = e;
        }
      }
    }
    this._drawQuads();
    return true;
  }

  // ------------------------------------------------------------ queries
  // Team at face-local (u,v): 0 none, 1 = team0, 2 = team1
  sample(faceId, u, v) {
    if (faceId < 0) return 0;
    const f = this.level.faces[faceId];
    if (!f || !f.atlas) return 0;   // (a face id from a stage being swapped in under a still-running match)
    const i = Math.min(f.nu - 1, Math.max(0, Math.floor(u / f.cu)));
    const j = Math.min(f.nv - 1, Math.max(0, Math.floor(v / f.cv)));
    return this.grid[f.grid + j * f.nu + i];
  }

  // Team at a world point lying on face faceId.
  sampleWorld(faceId, p) {
    if (faceId < 0) return 0;
    const f = this.level.faces[faceId];
    _rel.copy(p).sub(f.origin);
    return this.sample(faceId, _rel.dot(f.u), _rel.dot(f.v));
  }

  // Turf coverage fractions [team0, team1] of all live turf cells.
  coverage() {
    return [this.counts[0] / this.turfTotal, this.counts[1] / this.turfTotal];
  }

  // Fractions of turf cells within radius of (x, z) near height y: { own, enemy, empty } relative to `team`.
  regionStats(x, y, z, radius, team, out = { own: 0, enemy: 0, empty: 0, n: 0 }) {
    out.own = out.enemy = out.empty = out.n = 0;
    const ids = this.level.queryBlocks(x - radius, z - radius, x + radius, z + radius, this._qr || (this._qr = []));
    const own = team + 1;
    for (const bid of ids) {
      const b = this.level.blocks[bid];
      if (b.absent) continue;   // [b5-stagehooks] (taken out of play by a stage module)
      for (let fi = 0; fi < 6; fi++) {
        const fid = b.faces[fi];
        if (fid < 0) continue;
        const f = this.level.faces[fid];
        if (!f.turf || !f.atlas) continue;
        if (Math.abs(f.origin.y - y) > 2.5) continue;
        _rel.set(x, y, z).sub(f.origin);
        const lu = _rel.dot(f.u), lv = _rel.dot(f.v);
        const i0 = Math.max(0, Math.floor((lu - radius) / f.cu)), i1 = Math.min(f.nu - 1, Math.floor((lu + radius) / f.cu));
        const j0 = Math.max(0, Math.floor((lv - radius) / f.cv)), j1 = Math.min(f.nv - 1, Math.floor((lv + radius) / f.cv));
        for (let j = j0; j <= j1; j += 2) for (let i = i0; i <= i1; i += 2) {
          const du = (i + 0.5) * f.cu - lu, dv = (j + 0.5) * f.cv - lv;
          if (du * du + dv * dv > radius * radius) continue;
          const k = f.grid + j * f.nu + i;
          if (this.dead[k]) continue;
          const g = this.grid[k];
          out.n++;
          if (g === own) out.own++; else if (g) out.enemy++; else out.empty++;
        }
      }
    }
    if (out.n) { out.own /= out.n; out.enemy /= out.n; out.empty /= out.n; }
    return out;
  }

  // ------------------------------------------------------------ [b5-stagehooks] generic edits for stage modules
  // (src/game/stageMods.js, docs/STAGE-MODS.md). None of these is called on a stage without a module.
  // setClip({ map, box, faceOn(f), clipAt(et), inside(x, z) }) | null: cells of faces with faceOn(f) whose centre is
  // inside(x, z) and below clipAt(et) (et = the painter's stage time) take no ink; the atlas draw discards the same
  // texels (map: R > 0.5 inside, box: Vector4(x0, z0, 1 / width, 1 / depth)). Splats still spreading re-evaluate it.
  setClip(c) {
    this.clip = c || null;
    for (const f of this.paintFaces) f.clipOn = !!(c && c.faceOn(f));
    if (c && !this.aClip) {
      this.aClip = new Float32Array(MAX_QUADS * 4).fill(-1e9);
      const at = new THREE.BufferAttribute(this.aClip, 1); at.setUsage(THREE.DynamicDrawUsage);
      this.geo.setAttribute('aClip', at);
    }
    const D = this.mat.defines || (this.mat.defines = {});
    if (!!D.CLIP !== !!c) { if (c) D.CLIP = 1; else delete D.CLIP; this.mat.needsUpdate = true; }
    if (c) { this.mat.uniforms.uClipMap = { value: c.map }; this.mat.uniforms.uClipBox = { value: c.box }; }
  }
  // the world position of cell k's centre (out: Vector3), or null
  cellWorld(k, out = new THREE.Vector3()) {
    const f = this._faceOfCell(k);
    if (!f) return null;
    const c = k - f.grid, i = c % f.nu, j = (c - i) / f.nu;
    return out.copy(f.origin).addScaledVector(f.u, (i + 0.5) * f.cu).addScaledVector(f.v, (j + 0.5) * f.cv);
  }
  // zero these cells (live ones leave the counts); `sample` (an array) collects up to `max` of the inked ones (steam).
  // Returns how many were inked. The atlas is the caller's (drawInto / clearFaces).
  clearCells(ids, sample = null, max = 96) {
    const g = this.grid, live = this.live, cnt = this.counts;
    let n = 0;
    for (let i = 0; i < ids.length; i++) {
      const k = ids[i], v = g[k];
      if (!v) continue;
      if (live[k]) cnt[v - 1]--;
      g[k] = 0; n++;
      if (sample && sample.length < max) sample.push(k, v - 1);
    }
    if (n) this.version++;
    return n;
  }
  // these cells are never turf again (always under a liquid): dead, not live, out of turfTotal / turfArea and the counts
  retireCells(ids) {
    const g = this.grid, live = this.live, dead = this.dead, cnt = this.counts;
    for (let i = 0; i < ids.length; i++) {
      const k = ids[i];
      if (!live[k]) { dead[k] = 1; continue; }
      const f = this._faceOfCell(k);
      live[k] = 0; dead[k] = 1;
      this.turfTotal--; if (f) this.turfArea -= f.cu * f.cv;
      if (g[k]) cnt[g[k] - 1]--;
    }
    this.version++;
  }
  // these faces' cells to zero and their whole atlas rects (padding included) to bare
  clearFaces(faceIds) {
    const S = this.size, pos = [], index = [];
    for (const id of faceIds) {
      const f = this.level.faces[id];
      if (!f || !f.atlas) continue;
      const k0 = f.grid, k1 = f.grid + f.nu * f.nv;
      for (let k = k0; k < k1; k++) { const v = this.grid[k]; if (v) { if (this.live[k]) this.counts[v - 1]--; this.grid[k] = 0; } }
      const a = f.atlas, x0 = (a.x / S) * 2 - 1, y0 = (a.y / S) * 2 - 1, x1 = ((a.x + a.w) / S) * 2 - 1, y1 = ((a.y + a.h) / S) * 2 - 1, b = pos.length / 3;
      pos.push(x0, y0, 0, x1, y0, 0, x1, y1, 0, x0, y1, 0);
      index.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
    this.version++;
    if (!index.length) return;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(index);
    if (!this._clearMat) this._clearMat = new THREE.ShaderMaterial({ vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: 'precision highp float; void main() { gl_FragColor = vec4(0.0); }', depthTest: false, depthWrite: false, toneMapped: false, blending: THREE.NoBlending });
    const mesh = new THREE.Mesh(geo, this._clearMat); mesh.frustumCulled = false;
    const sc = new THREE.Scene(); sc.add(mesh);
    this.drawInto(sc);
    geo.dispose();
  }
  // render a scene of the caller's into the paint atlas (clip space = the atlas), on top of what is there
  drawInto(scene) {
    const r = this.renderer, prev = r.getRenderTarget(), ac = r.autoClear;
    r.autoClear = false;
    r.setRenderTarget(this.rt);
    r.render(scene, this.cam);
    r.setRenderTarget(prev);
    r.autoClear = ac;
  }

  dispose() {
    this._clearMat?.dispose();
    this.rt.dispose(); this.geo.dispose(); this.mat.dispose(); this.dryMesh.geometry.dispose(); this.dryMesh.material.dispose();
    for (const p of this._floodPrep.values()) p.geo.dispose();
    this._floodPrep.clear(); this._floods.length = 0;
    this._floodInk.dispose(); this._floodWipe.dispose();
    if (this._wipeMesh) { this._wipeMesh.geometry.dispose(); this._wipeMesh.material.dispose(); this._wipeMesh = null; }
  }
}
