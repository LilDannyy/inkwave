// Status looks on the players.
//   tracked    (Echo Orb, Lurk Mine, Tracer Bolt, Deep Sonar: status.track / status.reveal). 2026-10-02, the user (with a
//              Splatoon screenshot): "replace the tracking effect again, this time to have an arrow circle around the
//              player using the colour of the enemy, and if you're the one tracking the player, a thin line directly to
//              the middle of the player. dont show their name." — then: "everyone on the tracking team should get a line
//              not just the user. anyone on the tracking team sees the line and the arrow through walls. if im tracked
//              then i just see arrow on me. if my teammates is getting tracked, i see the arrow but not through walls". So:
//                · ONE arrow wrapped round them like a label round a can — the game's own squid icon (ui-icons.js
//                  SQUID) turned on its side and stretched out (the user, with Splatoon 3's Wave Breaker ring: "one
//                  continuous arrow, but its flat, rolled up like a cylinder, and rotates around the player", "make the
//                  circle closer to the player … notice how its more rounded in Splatoon", "those are eyes of the squid
//                  icon rotated 90 degrees and lengthened into an arrow"): the squid's mantle is the arrowhead (its
//                  rounded point the tip, its fins the plump barbs, their backs curving into the shaft), its two eyes
//                  sit in the head one above the other, its body is the long shaft (round-ended), its four tentacles
//                  the rounded lobes of the tail. Rolled onto an upright cylinder hugging the body at waist / chest
//                  height ("even tighter": BAND_R, just clear of the torso, the arms at rest and the ink tank — a held
//                  weapon may poke through it), spanning ARC (~312°) so the head nearly meets the tail; a soft gradient
//                  across its height (darker up top), a gloss streak, a lighter rim; both sides drawn, its inside (the
//                  far side) darker; unlit, in the TRACKING team's colour (the tracked player's enemy); where it's
//                  hidden (the trackers see it through walls) a see-through fill inside a firm rim. It turns round them
//                  the way it points (a turn every 2π/SPIN ≈ 2.6 s) and bobs a little. Its size holds within GROW_FROM m
//                  of the camera; beyond, it grows gently (× GROW_MAX at most);
//                · it arrives ("have the ribbons fly out of the source … and quickly fly to the enemy and then wrap
//                  around them, and when the mark is over, have the leave the ribbon ripple out then fly away"): a fresh
//                  mark (actor:marked, fresh, with its source — the Echo Orb's burst, the Lurk Mine, the Tracer's hit,
//                  the user of Deep Sonar) sends the arrow out of the source as a ribbon, head first along a slight arc
//                  to the side of the player where the circle carries on its way (FLY_MIN + FLY_PER_M a metre, ≤
//                  FLY_MAX s), then round them while the rest curls in behind (WRAP_T s) into the band, spinning on.
//                  Cosmetic only: the mark (the reveal, the line, the map) is on at once. A refreshed mark doesn't fly
//                  again (a little pulse); one with no source here (the owner's word alone, online) pops in. When the
//                  mark ends the band ripples (RIPPLE_T s, a wave running along it, growing) and unwinds from its tail,
//                  flying off up and out and fading (EXIT_T s); splatted, it ripples briefly and is gone (DIE_T s);
//                · who sees what, on each screen (the local player's — StatusFx.viewer in tests / pictures):
//                    on the TRACKING team   the arrow through walls (a second, occluded pass: GreaterDepth) and a thin
//                                           line (Line2, LINE_PX screen px) from your chest to the middle of theirs,
//                                           through walls, in your team's colour — one per tracked enemy, whoever threw;
//                    the tracked player     the arrow round your own kid, a little fainter; no line;
//                    their teammates        the arrow, depth-tested (not through walls); no line.
//                  (Bots draw nothing: it's only the local view.)
//                · no name: the HUD's world markers no longer tag tracked enemies (main.js _updateHud);
//                · its sounds (src/audio/cues.js): the mark's coming and going as everyone hears them — mark:on
//                  { actor, team } the moment a player is marked (alive), mark:off { actor, team, splat } when it ends —
//                  whatever's drawn (a remote player not in view yet still counts).
//              The old see-through sonar shell and its ground ping are gone.
//   poisoned   (Murk Bomb: status.poison) — murky purple-grey bubbles and wisps rising off them, a few at a time.
// They follow each player's status: local players' and bots' own, and for a remote player online the owner's word too
// (net/netmatch.js packs statusBits() into the actor tick → a.netStatus; two teams, so "tracked" is by the other one), so
// every screen shows them while they last and drops them when they end. Pooled: one wrapped arrow (+ a line, made the
// first time it's needed) per player, one instanced draw for every poison particle (capped at MAXP); nothing is
// allocated per frame. Updated by SubSystem.update.
import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { G, on, emit } from '../core/ctx.js';

export const NET_TRACKED = 1, NET_POISONED = 2;
// the team tracking `a` (-1: nobody). Two teams: a remote player the owner says is tracked is tracked by the other one
export function trackedBy(a) {
  const st = a.status;
  if (st) {
    if (st.track > 0 && st.trackTeam >= 0) return st.trackTeam;
    if (st.reveal > 0 && st.revealTeam >= 0) return st.revealTeam;
  }
  if (a.remote && (a.netStatus & NET_TRACKED)) return 1 - a.team;
  return -1;
}
export const isPoisoned = (a) => (a.status && a.status.poison > 0) || !!(a.remote && (a.netStatus & NET_POISONED));
// the owner's side (the actor tick): what this player's own status says
export function statusBits(a) {
  const st = a.status;
  return st ? ((st.track > 0 || st.reveal > 0) ? NET_TRACKED : 0) | (st.poison > 0 ? NET_POISONED : 0) : 0;
}

// the wrapped arrow (the band). Its shape comes from the game's squid icon (64-unit box), U metres a unit
export const U = 0.0098;
export const BAND_R = 0.46, BAND_Y = 0.85;  // round a kid (m): the cylinder's radius (the body's reach at its height, idle or
                                            // walking, any kit: ≤ 0.43 — tools/botlab/tests/track-arrows.js 'clear'), its
                                            // middle over the feet (a kid is 1.45 tall)
const SQUID_K = 0.8, BAND_Y_SQ = 0.42;      // round a squid: × 0.8, lower
export const SHAFT_H = 28 * U;              // the arrow (m): its shaft's height (the icon's body); its head's: HEAD_H, below
export const ARC = 5.45;                    // rad round the cylinder it spans, tentacle tips to the head's tip (~312°)
export const SPIN = (2 * Math.PI) / 2.6;    // rad/s round them, the way it points (a turn every 2.6 s)
const BOB = 0.03, BOB_W = 2.2;              // its bob (m, rad/s)
export const GROW_FROM = 20, GROW_PER_M = 0.01, GROW_MAX = 1.4;   // its size: as it is within 20 m of the camera, then
                                            // +1 % a metre, × 1.4 at most (the walls and the line carry it further)
// the arrival and the going (s)
export const FLY_MIN = 0.22, FLY_PER_M = 0.018, FLY_MAX = 0.6;   // the ribbon's flight from the source: by its length
export const WRAP_T = 0.25;                 // … round them, curling in behind the head
export const RIPPLE_T = 0.3, EXIT_T = 0.45, DIE_T = 0.22;       // the mark over: the ripple, the fly-away; splatted
const PULSE_T = 0.28;                       // a refreshed mark's pulse
const MARK_FRESH = 0.3;                     // s: a source heard this recently flies the ribbon in
export const SELF_A = 0.55;                 // on your own kid (the follow view): a little fainter
const MATE_A = 1, XRAY_A = 0.9;             // depth-tested for the tracked player's teammates; its hidden parts for the trackers
const POP = 0.22;                           // s: a fresh one pops in
// the line (the tracking team's view)
export const LINE_PX = 3.5, LINE_A = 0.8;   // width (screen px; 1.75 read too thin in play), opacity
export const CHEST = 0.95, CHEST_SQ = 0.3;  // the middle of a kid / a squid over its feet (m)
const LINE_OFF = 0.3;                       // it leaves your chest this far toward them (not from inside your own kid)
// poison
const MAXP = 220;                          // poison particles alive at once (every player together)
const RATE = 14, RATE_SELF = 7;            // poison particles a second off a player (off your own kid)
const SELF_SIZE = 0.8;                     // … and their size off your own kid (the follow view: never in your way)

export const chestY = (a) => (a.form === 'squid' ? CHEST_SQ : CHEST);
const TAU = Math.PI * 2;

// (see-through looks stay out of the GTAO normal / depth pass: drawn solid there they'd darken what's behind — subs.js
// noAO; on geometry only these use)
const noAO = (mesh) => { mesh.onBeforeRender = (r, scene, c, geo) => { geo.drawRange.count = scene.overrideMaterial ? 0 : Infinity; }; return mesh; };

// the arrowhead: the squid icon's mantle — its rounded point, a fin with a round end, the fin's back curving into the body
// (a fillet), the body down to where the shaft takes over — sampled from the icon's own curves (src/ui/ui-icons.js
// SQUID), right half (y ≥ 0; the shader mirrors it), turned on its side: metres back from the tip × metres up, closed
// just under the middle line (so the halves meet without a seam)
const bz = (pts, n, out) => {
  for (let i = 1; i <= n; i++) {
    const t = i / n, u = 1 - t;
    const w = pts.length === 4 ? [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t] : [u * u, 2 * u * t, t * t];
    out.push([w.reduce((a, k, j) => a + k * pts[j][0], 0), w.reduce((a, k, j) => a + k * pts[j][1], 0)]);
  }
};
const HEAD_CUT = 40;                        // icon y where the body becomes the shaft (the tip is at y 3)
const HEAD_ICON = (() => {
  const o = [[32, 3]];
  bz([[32, 3], [38.5, 3], [53.5, 13.5], [56.5, 23.5]], 18, o);              // the mantle's side, out to the fin (a little plumper than the icon's)
  bz([[56.5, 23.5], [58.5, 28], [55.5, 32], [51, 31]], 10, o);              // the fin's round end
  const c = [46, 29.6], f = [51 - 46, 31 - 29.6], fl = Math.hypot(f[0], f[1]);
  bz([[c[0] + (f[0] / fl) * 5, c[1] + (f[1] / fl) * 5], c, [46, 34.6]], 9, o);   // the fin's back curving into the body
  o.push([46, HEAD_CUT]);
  return o;
})();
const HEAD_PTS = [...HEAD_ICON.map(([x, y]) => [-(y - 3) * U, (x - 32) * U]), [-(HEAD_CUT - 3) * U, -0.05], [0, -0.05]];
export const HEAD_H = 2 * Math.max(...HEAD_PTS.map((p) => p[1]));   // the head's height (m): the fins, ~1.8× the shaft's
export const HEAD_LEN = (HEAD_CUT - 3) * U; // tip → where the shaft takes over (m)

// the arrow, one piece: a strip of upright cylinder wall (unit radius: the mesh's scale puts it at the band's radius)
// from just behind the tentacles round ARC to just past the tip, facing out, as tall as the head and tentacles only at
// the ends (the shaft's height + a margin elsewhere, so it hugs the arrow); aPY: its angle round, metres up from its
// middle — the shader cuts the arrow out of it (in metres along it: the angle × the radius, so a wider band only
// lengthens the shaft). Two groups over the same triangles: its inside (the far side) is drawn first, then its outside,
// so the near side always lies over the far one
const BAND_PAD = 0.1, BAND_N = 160;
const TALL_TAIL = 0.24 / BAND_R, TALL_HEAD = 0.34 / BAND_R;   // rad from each end the strip stands the head's height (the tentacles, the head)
export function bandGeometry() {
  const HT = HEAD_H / 2 + 0.02, HS = SHAFT_H / 2 + 0.02, p0 = -BAND_PAD, p1 = ARC + BAND_PAD;
  const pos = [], nor = [], py = [], idx = [];
  for (let i = 0; i <= BAND_N; i++) {
    const phi = p0 + ((p1 - p0) * i) / BAND_N, x = Math.sin(phi), z = Math.cos(phi);
    const H = phi < TALL_TAIL || phi > ARC - TALL_HEAD ? HT : HS;
    for (const y of [-H, H]) { pos.push(x, y, z); nor.push(x, 0, z); py.push(phi, y); }
  }
  // (seen from outside, along increases to the right: counter-clockwise from outside)
  for (let i = 0; i < BAND_N; i++) { const b0 = i * 2; idx.push(b0, b0 + 2, b0 + 3, b0, b0 + 3, b0 + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aPY', new THREE.Float32BufferAttribute(py, 2));
  g.setIndex(idx);
  g.addGroup(0, idx.length, 0); g.addGroup(0, idx.length, 1);
  return g;
}
const f4 = (x) => x.toFixed(4), v2s = (p) => `vec2(${f4(p[0])}, ${f4(p[1])})`;
// two ways to place it: the band (uPath 0: the mesh's transform puts the unit strip round the kid; uRip a ripple, as a
// share of the radius) or a path (uPath ±1, world space, the mesh at identity): a quadratic Bézier (uB0 … uB2, uBL long)
// joined to the circle round the kid (uC, uCR) at the angle uA0 — the arrow lies along it, uHead its leading end's
// distance along it: +1 the head leads in from the source and round (the arrival; what hasn't left the source is
// hidden), −1 the tail leads off the circle and away (the going); uRip a ripple (m) up and down it there. On the circle
// the strip stands upright (the band); off it, it turns about its own path to face the camera (so a ribbon flying away
// from you, or straight up, still reads flat), easing upright over the last 0.8 m before the circle
const BAND_VS = /* glsl */`
  attribute vec2 aPY;
  uniform float uR, uPath, uCR, uSc, uHead, uBL, uA0, uRip, uRipT;
  uniform vec3 uC, uB0, uB1, uB2;
  varying vec2 vSY; varying float vHide;
  vec3 bez(float t){ float u = 1.0 - t; return u * u * uB0 + 2.0 * u * t * uB1 + t * t * uB2; }
  vec3 bezT(float t){ return 2.0 * (1.0 - t) * (uB1 - uB0) + 2.0 * t * (uB2 - uB1); }
  vec3 ring(float a){ return uC + vec3(sin(a), 0.0, cos(a)) * uCR; }
  // the strip's width off the circle: square to its path and to the view (upright where that fails), eased upright by k
  vec3 across(vec3 p, vec3 t, float k){
    vec3 w = cross(normalize(t), normalize(cameraPosition - p));
    w = length(w) < 1e-3 ? vec3(0.0, 1.0, 0.0) : normalize(w);
    if (w.y < 0.0) w = -w;
    return normalize(mix(w, vec3(0.0, 1.0, 0.0), k));
  }
  void main(){
    vSY = vec2(aPY.x * uR, aPY.y); vHide = 0.0;
    vec3 p;
    if (uPath == 0.0) {
      p = position;
      p.xz *= 1.0 + uRip * sin(aPY.x * 7.0 - uRipT * 16.0);
    } else {
      float s = vSY.x * uSc, L = ${f4(ARC)} * uR * uSc;
      vec3 w = vec3(0.0, 1.0, 0.0);
      if (uPath > 0.0) {
        float d = uHead - (L - s);
        if (d < 0.0) { vHide = 1.0; p = uB0; }
        else if (d < uBL) { p = bez(d / uBL); w = across(p, bezT(d / uBL), smoothstep(uBL - 0.8, uBL, d)); }
        else p = ring(uA0 + (d - uBL) / uCR);
      } else {
        float u = uHead - s;
        if (u < 0.0) p = ring(uA0 - u / uCR);
        else if (u < uBL) { p = bez(u / uBL); w = across(p, bezT(u / uBL), 1.0 - smoothstep(0.0, 0.8, u)); }
        else { p = uB2 + normalize(uB2 - uB1) * (u - uBL); w = across(p, uB2 - uB1, 0.0); }
      }
      p += w * (aPY.y * uSc) + vec3(0.0, uRip * sin(s * 9.0 - uRipT * 18.0), 0.0);
    }
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;
// the squid arrow's shape as GLSL (its head polygon and the distance-field helpers BAND_FS builds it from) — shared:
// Surf N' Turf's rings (src/fx/surfFx.js) are drawn as the same ribbon
export const ARROW_GLSL = /* glsl */`
  const vec2 HEAD[${HEAD_PTS.length}] = vec2[${HEAD_PTS.length}](${HEAD_PTS.map(v2s).join(', ')});
  float sdHead(vec2 p){
    float d = dot(p - HEAD[0], p - HEAD[0]), s = 1.0;
    for (int i = 0, j = ${HEAD_PTS.length - 1}; i < ${HEAD_PTS.length}; j = i, i++) {
      vec2 e = HEAD[j] - HEAD[i], w = p - HEAD[i], b = w - e * clamp(dot(w, e) / dot(e, e), 0.0, 1.0);
      d = min(d, dot(b, b));
      bvec3 c = bvec3(p.y >= HEAD[i].y, p.y < HEAD[j].y, e.x * w.y > e.y * w.x);
      if (all(c) || all(not(c))) s *= -1.0;
    }
    return s * sqrt(d);
  }
  float sdRBox(vec2 p, vec2 c, vec2 h, float r){ vec2 q = abs(p - c) - h + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
  float sdTaper(vec2 p, vec2 a, vec2 b, float ra, float rb){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - mix(ra, rb, h); }
  float sdEll(vec2 p, vec2 c, vec2 r){ return (length((p - c) / r) - 1.0) * min(r.x, r.y); }
  float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
  float fill(float d){ float aa = max(fwidth(d), 1e-4); return 1.0 - smoothstep(-aa, aa, d); }
`;
// the squid arrow as a distance field (metres along × up; q mirrors it about the middle line): the mantle polygon, the
// round-ended shaft, four tentacles (tapered, round-tipped, the outer pair swept out) smoothly joined on. Unlit: the
// team colour darker toward the top, a gloss streak under the middle, a lighter rim, the mantle's highlight near the
// tip; the eyes (white, a dark rim, a dark pupil looking ahead) stacked in the head with a clear gap; crisp at any
// size (each edge smoothed over a pixel, fwidth); its inside (the far side) darker
const BAND_FS = /* glsl */`
  uniform vec3 uColor; uniform float uAlpha; uniform float uXray; uniform float uR;
  varying vec2 vSY; varying float vHide;
${ARROW_GLSL}  void main(){
    const float U = ${f4(U)}, SH = ${f4(SHAFT_H / 2)}, HH = ${f4(HEAD_H / 2)}, HL = ${f4(HEAD_LEN)};
    if (vHide > 0.5) discard;   // (the arrival: still inside the source)
    vec2 p = vSY, q = vec2(p.x, abs(p.y));
    float L = ${f4(ARC)} * uR;                                      // the tip
    // the shaft (the squid's body, stretched; round-ended), on under the head; the head where it is
    float d = sdRBox(p, vec2((0.1 + L - HL + 0.25) * 0.5, 0.0), vec2((L - HL + 0.25 - 0.1) * 0.5, SH), 0.06);
    if (p.x > L - HL - 0.06) d = min(d, sdHead(vec2(p.x - L, q.y)));
    // the tentacles: the inner pair straight back, the outer pair swept out; tapered, round-tipped
    float t = min(sdTaper(q, vec2(0.17, 3.2 * U), vec2(0.17 - 14.0 * U, 4.4 * U), 4.0 * U, 3.3 * U),
                  sdTaper(q, vec2(0.17, 9.0 * U), vec2(0.17 - 12.0 * U, 13.5 * U), 4.2 * U, 3.4 * U));
    d = smin(d, t, 0.025);
    float a = fill(d);
    if (a < 0.004) discard;
    // its colour: darker toward the top, a gloss streak under the middle, a lighter rim, the mantle's highlight
    vec3 c = uColor * (1.12 - 0.5 * clamp((p.y + HH) / (2.0 * HH), 0.0, 1.0));
    c += 0.16 * exp(-pow((p.y + 0.32 * SH) / (0.3 * SH), 2.0));
    float rim = 1.0 - smoothstep(0.0, 0.022, -d);
    c = mix(c, vec3(1.0), 0.4 * rim);
    vec2 hp = vec2(p.x - L, p.y);
    float hs = length(hp - vec2(-10.0 * U, -7.0 * U) - clamp(dot(hp - vec2(-10.0 * U, -7.0 * U), vec2(4.8, 6.5) * U) / dot(vec2(4.8, 6.5) * U, vec2(4.8, 6.5) * U), 0.0, 1.0) * vec2(4.8, 6.5) * U);
    c = mix(c, vec3(1.0), 0.35 * (1.0 - smoothstep(0.6 * U, 2.0 * U, hs)));
    // the eyes: white, a dark rim, a dark pupil looking ahead; one above the other with a clear gap
    vec2 ec = vec2(L - 33.0 * U, 6.6 * U);
    float eo = sdEll(q, ec, vec2(5.4, 4.3) * U), ew = eo + 0.9 * U, ep = sdEll(q, ec + vec2(1.1, -0.7) * U, vec2(3.0, 2.4) * U);
    vec3 ink = vec3(0.007, 0.006, 0.011);
    c = mix(c, ink, fill(eo)); c = mix(c, vec3(0.93, 0.94, 0.97), fill(ew)); c = mix(c, ink, fill(ep));
    if (!gl_FrontFacing) c *= 0.6;   // its inside: the far side, darker
    // seen through something (the trackers' hidden-part pass): a see-through fill inside a firm rim
    a *= mix(1.0, mix(0.45, 1.0, 1.0 - smoothstep(0.0, 0.05, -d)), uXray);
    gl_FragColor = vec4(c, a * uAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

// poison particles: camera-facing quads (world-sized: the same at any render scale), one instanced draw.
// aP: centre xyz + size (m) · aD: alpha, kind (0 bubble, 1 wisp), seed, age 0 … 1
const PART_VS = /* glsl */`
  attribute vec4 aP; attribute vec4 aD;
  varying vec2 vUv; varying vec4 vD; varying float vNear;
  void main(){
    vUv = position.xy * 2.0; vD = aD;
    vec4 mv = modelViewMatrix * vec4(aP.xyz, 1.0);
    vNear = smoothstep(0.9, 2.2, -mv.z);   // (fades out right in front of the camera: never a screenful)
    mv.xy += position.xy * aP.w;
    gl_Position = projectionMatrix * mv;
  }`;
const PART_FS = /* glsl */`
  varying vec2 vUv; varying vec4 vD; varying float vNear;
  void main(){
    float d = length(vUv);
    if (d > 1.0 || vD.x < 0.004) discard;
    vec3 c; float a;
    if (vD.y < 0.5) {
      // a bubble: a dark, murky purple body, a thin violet rim, a glint up top
      float rim = smoothstep(0.74, 0.93, d) * smoothstep(1.0, 0.94, d);
      float glint = smoothstep(0.22, 0.0, length(vUv - vec2(-0.34, 0.38)));
      c = mix(vec3(0.04, 0.019, 0.064), vec3(0.32, 0.17, 0.57), rim);   // (linear: sRGB #382748 → #9973c7)
      c = mix(c, vec3(0.89, 0.83, 1.0), glint);
      a = max(0.86 * smoothstep(1.0, 0.9, d), rim) + glint * 0.5;
    } else {
      // a wisp: a soft murky purple-grey puff, darker at its heart
      float k = (1.0 - smoothstep(0.0, 1.0, d)) * (0.88 + 0.12 * sin(vD.z * 40.0 + d * 7.0));
      c = mix(vec3(0.12, 0.084, 0.147), vec3(0.022, 0.013, 0.033), k);   // (linear: sRGB #61526b → #291f33)
      a = sqrt(k) * 0.62;
    }
    gl_FragColor = vec4(c, a * vD.x * vNear);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

// a tiny seeded random of our own (the FX never draw from Math.random: gameplay runs stay comparable)
let _seed = 0x2f6b1a3;
const rnd = () => ((_seed = (Math.imul(_seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const _p = new THREE.Vector3(), _c = new THREE.Vector3(), _f = new THREE.Vector3(), _s = new THREE.Vector3(), _e = new THREE.Vector3();
// the paths (scratch): a quadratic Bézier and its length
const bez = (out, a, b, c, t) => { const u = 1 - t; return out.set(u * u * a.x + 2 * u * t * b.x + t * t * c.x, u * u * a.y + 2 * u * t * b.y + t * t * c.y, u * u * a.z + 2 * u * t * b.z + t * t * c.z); };
const _bq = new THREE.Vector3(), _bq2 = new THREE.Vector3();
function bezLen(a, b, c) { let L = 0; _bq.copy(a); for (let i = 1; i <= 16; i++) { bez(_bq2, a, b, c, i / 16); L += _bq2.distanceTo(_bq); _bq.copy(_bq2); } return L; }
const UP = new THREE.Vector3(0, 1, 0);
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const easeOutBack = (x) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

export class StatusFx {
  constructor(scene) {
    this.scene = scene;
    this.recs = new Map();       // actor → { wrapped arrow, line, poison emitter }
    this.parts = [];             // live poison particles
    this.time = 0;
    this.viewer = null;          // (tests / pictures) whose eyes: an actor, or null = the local player
    this.bandGeo = null;         // the wrapped arrow's strip (every player's: made the first time it's needed)
    this.pending = new Map();    // actor → { from (a point or an actor), t }: a fresh mark's source, for the arrival
    this.marks = new Map();      // actor → the team marking them (the sounds' mark:on / mark:off)
    this.stats = { bands: 0, xray: 0, lines: 0, flights: 0, exits: 0, parts: 0, emitted: 0 };   // (tests read it)
    this._buildParts();
    // a mark (subs.js track): fresh → its source flies the ribbon in; a refresh → a pulse on the band
    on('actor:marked', ({ actor, from, fresh }) => {
      if (fresh) this.pending.set(actor, { from: from && from.isVector3 ? from.clone() : from || null, t: this.time });
      else { const r = this.recs.get(actor); if (r && r.on && r.phase === 'band') r.pulse = 1; }
    });
  }
  _buildParts() {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    this.aP = new THREE.InstancedBufferAttribute(new Float32Array(MAXP * 4), 4); this.aP.setUsage(THREE.DynamicDrawUsage);
    this.aD = new THREE.InstancedBufferAttribute(new Float32Array(MAXP * 4), 4); this.aD.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('aP', this.aP); g.setAttribute('aD', this.aD);
    g.instanceCount = 0;
    const mat = new THREE.ShaderMaterial({ vertexShader: PART_VS, fragmentShader: PART_FS, transparent: true, depthWrite: false });
    this.partMesh = noAO(new THREE.Mesh(g, mat));
    this.partMesh.frustumCulled = false; this.partMesh.renderOrder = 6;
    this.scene.add(this.partMesh);
  }
  _rec(a) {
    let r = this.recs.get(a);
    if (r) return r;
    // the arrow: one strip, drawn depth-tested — and for the trackers once more where something stands in front of it
    // (first, so the depth-tested draw lies over it where it's in sight)
    const geo = this.bandGeo || (this.bandGeo = bandGeometry());
    const col = { value: new THREE.Color() }, rad = { value: BAND_R };
    // (the placement's uniforms: shared by both draws)
    const P = { uPath: { value: 0 }, uCR: { value: 1 }, uSc: { value: 1 }, uHead: { value: 0 }, uBL: { value: 1 }, uA0: { value: 0 }, uRip: { value: 0 }, uRipT: { value: 0 },
      uC: { value: new THREE.Vector3() }, uB0: { value: new THREE.Vector3() }, uB1: { value: new THREE.Vector3() }, uB2: { value: new THREE.Vector3() } };
    const mk = (xray) => {
      const u = { uColor: col, uAlpha: { value: 0 }, uXray: { value: xray ? 1 : 0 }, uR: rad, ...P };
      const mat = (side) => new THREE.ShaderMaterial({ uniforms: u, vertexShader: BAND_VS, fragmentShader: BAND_FS, transparent: true, depthWrite: false, side, depthFunc: xray ? THREE.GreaterDepth : THREE.LessEqualDepth });
      // (the depth-tested arrow's near side stands in the GTAO normal / depth pass — the strip hugs the arrow — so its
      // pixels take their ambient occlusion from it, none, not from whatever's behind it: a wall's edge, the kid's body
      // would darken across it. The far side, the strip's inside facing away, is culled there; the hidden-part pass
      // stays out: noAO)
      // (… except while it flies or ripples: its strip isn't where the mesh's transform says then)
      const m = new THREE.Mesh(geo, [mat(THREE.BackSide), mat(THREE.FrontSide)]);
      if (xray) noAO(m);
      else m.onBeforeRender = (rr, scene, c, g) => { g.drawRange.count = scene.overrideMaterial && m.userData.moving ? 0 : Infinity; };
      m.frustumCulled = false; m.visible = false; m.renderOrder = xray ? 6 : 7;
      return m;
    };
    const band = mk(false), bandX = mk(true);
    this.scene.add(band, bandX);
    r = { a, band, bandX, U: band.material[0].uniforms, line: null, on: false, t0: 0, team: -1, form: 0, spin: 0, size: 1,
      phase: 'off', pt: 0, fly: null, ex: null, pulse: 0, xr: false, self: false, head: new THREE.Vector3(), c: new THREE.Vector3(), scl: 1,
      from: new THREE.Vector3(), to: new THREE.Vector3(), emit: 0, poisoned: false };
    this.recs.set(a, r);
    return r;
  }
  // whose eyes the looks follow: StatusFx.viewer (tests, pictures) or the local player; their team (no player: the
  // subs' view team — a spectator sees what a team sees)
  eyes() { return this.viewer || G.local || null; }
  // per frame (after everyone moved)
  update(dt) {
    this.time += dt;
    const actors = G.actors || [];
    // a player gone with the match they were in: their looks go too
    for (const [a, r] of this.recs) if (!actors.includes(a)) this._drop(r);
    const me = this.eyes(), vt = me ? me.team : (G.subs?.viewTeam?.() ?? -1), cam = G.camera;
    let bands = 0, xray = 0, lines = 0;
    let flights = 0, exits = 0;
    for (const a of actors) {
      const shown = a.alive && a.character?.root?.visible !== false;
      const team = shown ? trackedBy(a) : -1;
      this._markState(a, a.alive ? trackedBy(a) : -1);
      let r = this.recs.get(a);
      if (team >= 0) {
        r = r || this._rec(a);
        if (!r.on || r.team !== team) this._begin(r, a, team);
        r.pt += dt;
        if (r.phase === 'fly') { this._flight(r, a, dt, me, vt, cam); flights++; } else this._band(r, a, dt, me, vt, cam);
        bands++; if (r.bandX.visible) xray++;
        // the line: on the tracking team's screens (whoever threw), from your kid while you're up
        if (me && me.team === team && me !== a && me.alive) { this._line(r, a, me, 1); lines++; }
        else if (r.line) r.line.visible = false;
      } else if (r && r.on) this._end(r, a);
      // the going: the ripple, then the fly-away (or splatted, a short ripple and gone); the line fades with the ripple
      if (r && !r.on && r.phase !== 'off') {
        r.pt += dt;
        this._exit(r, a, dt, cam); exits++;
        if (r.line && r.line.visible) { if (r.phase === 'rip' && me && me.team === r.team && me.alive) this._line(r, a, me, 1 - r.pt / RIPPLE_T); else r.line.visible = false; }
      }
      // poison: emit while it lasts
      if (shown && isPoisoned(a)) {
        r = r || this._rec(a);
        r.poisoned = true;
        r.emit += dt * (a === G.local ? RATE_SELF : RATE);
        while (r.emit >= 1) { r.emit -= 1; this._spawn(a); }
      } else if (r) { r.poisoned = false; r.emit = 0; }
    }
    this._stepParts(dt);
    this.stats.bands = bands; this.stats.xray = xray; this.stats.lines = lines; this.stats.flights = flights; this.stats.exits = exits; this.stats.parts = this.parts.length;
  }
  // the mark's coming and going for the sounds (src/audio/cues.js): alive and marked, whatever's drawn
  _markState(a, team) {
    const was = this.marks.has(a) ? this.marks.get(a) : -1;
    if (team === was) return;
    if (was >= 0) emit('mark:off', { actor: a, team: was, splat: !a.alive });
    if (team >= 0) { this.marks.set(a, team); emit('mark:on', { actor: a, team }); } else this.marks.delete(a);
  }
  // a mark lands: the arrow flies in from its source (heard just now), or pops in (none: a refresh across a gap, the
  // owner's word alone online)
  _begin(r, a, team) {
    r.on = true; r.t0 = this.time; r.team = team; r.pulse = 0;
    r.U.uColor.value.copy(G.teamColors[team]);
    const pd = this.pending.get(a);
    this.pending.delete(a);
    r.pt = 0; r.ex = null;
    if (pd && pd.from && this.time - pd.t <= MARK_FRESH) {
      const f = pd.from, src = new THREE.Vector3();
      if (f.isVector3) src.copy(f); else if (f.visualPos) { f.visualPos(src); src.y += chestY(f); } else if (f.pos) src.copy(f.pos);
      r.phase = 'fly'; r.fly = { src, T: 0, aE: 0 };
    } else { r.phase = 'band'; r.fly = null; }
  }
  // the mark is over: ripple and fly away, or (splatted) a short ripple and gone
  _end(r, a) {
    r.on = false; r.pt = 0;
    r.phase = !a.alive ? 'die' : r.phase === 'off' ? 'off' : 'rip';
    if (r.phase === 'off') { r.band.visible = r.bandX.visible = false; if (r.line) r.line.visible = false; }
  }
  // where it sits round them this frame: _p the feet, _c the band's middle, and its size
  _centre(r, a, dt, cam) {
    a.visualPos ? a.visualPos(_p) : _p.copy(a.pos);
    // kid → squid: it sinks and tightens round the squid (smoothly)
    r.form += ((a.form === 'squid' ? 1 : 0) - r.form) * Math.min(1, dt * 12);
    const k0 = 1 + (SQUID_K - 1) * r.form, Y = BAND_Y + (BAND_Y_SQ - BAND_Y) * r.form;
    _c.set(_p.x, _p.y + Y, _p.z);
    const s = cam ? this._growth(_c, cam) : 1;
    r.size = s;
    _c.y += Math.sin(this.time * BOB_W) * BOB * Math.min(s, 1.5);
    r.c.copy(_c); r.scl = k0 * s;
    return r.scl;
  }
  // who's looking decides how it's drawn: the trackers through walls, the marked player fainter on their own kid
  _looks(r, a, me, vt) { r.self = a === me; r.xr = !r.self && vt === r.team; }
  _alpha(r, k) {
    const u = r.U;
    u.uAlpha.value = k * (r.self ? SELF_A : r.xr ? 1 : MATE_A);
    r.band.visible = true;
    r.bandX.visible = r.xr;
    r.bandX.material[0].uniforms.uAlpha.value = k * XRAY_A;
  }
  // the band round them (uPath 0)
  _band(r, a, dt, me, vt, cam, rip = 0, k = 1) {
    if (r.on) this._looks(r, a, me, vt);
    const sc = this._centre(r, a, dt, cam);
    r.spin = (r.spin + SPIN * dt) % TAU;
    const pop = r.phase === 'band' && !r.fly ? Math.min(1, r.pt / POP) : 1;
    r.pulse = Math.max(0, r.pulse - dt / PULSE_T);
    const pk = 1 + 0.14 * Math.sin(Math.PI * r.pulse) * r.pulse;
    const sy = sc * (0.35 + 0.65 * easeOutBack(pop)) * pk, R = BAND_R * sc * pk;
    for (const m of [r.band, r.bandX]) { m.position.copy(_c); m.rotation.y = r.spin; m.scale.set(R, sy, R); }
    const u = r.U;
    u.uPath.value = 0; u.uRip.value = rip; u.uRipT.value = this.time;
    r.band.userData.moving = rip > 0;
    r.head.set(_c.x + Math.sin(r.spin + ARC) * R, _c.y, _c.z + Math.cos(r.spin + ARC) * R);   // (the tip: tests)
    this._alpha(r, Math.min(1, (r.fly ? 1 : r.pt / (POP * 0.6))) * k);
  }
  // the path's mesh: world space
  _pathMesh(r) {
    for (const m of [r.band, r.bandX]) { m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); m.scale.set(1, 1, 1); }
    r.band.userData.moving = true;
  }
  // the arrival: out of the source, head first along a slight arc to the side of them where the circle carries on its
  // way, then round them, the rest curling in behind (uPath +1); then the band, spinning on from there
  _flight(r, a, dt, me, vt, cam) {
    this._looks(r, a, me, vt);
    const sc = this._centre(r, a, dt, cam), CR = BAND_R * sc, F = r.fly, u = r.U;
    if (!F.T) {   // (its first frame: the entry side and the flight's length → its time)
      F.aE = Math.atan2(F.src.x - _c.x, F.src.z - _c.z) + Math.PI / 2;
      const d0 = Math.hypot(F.src.x - (_c.x + Math.sin(F.aE) * CR), F.src.y - _c.y, F.src.z - (_c.z + Math.cos(F.aE) * CR));
      F.T = Math.min(FLY_MAX, FLY_MIN + FLY_PER_M * d0);
    }
    const B0 = u.uB0.value.copy(F.src), B2 = u.uB2.value.set(_c.x + Math.sin(F.aE) * CR, _c.y, _c.z + Math.cos(F.aE) * CR);
    const d = B0.distanceTo(B2), k = Math.min(3, Math.max(0.3, d * 0.45)), arc = Math.min(1.5, Math.max(0.3, d * 0.18));
    const B1 = u.uB1.value.set(B2.x - Math.cos(F.aE) * k, B2.y + arc, B2.z + Math.sin(F.aE) * k);   // (upstream of the entry, along the circle's way: it comes in on it)
    const BL = bezLen(B0, B1, B2), L = ARC * BAND_R * sc;
    const wrap = r.pt <= F.T ? 0 : Math.min(1, (r.pt - F.T) / WRAP_T);
    const head = r.pt <= F.T ? BL * (r.pt / F.T) : BL + L * easeOutCubic(wrap);
    u.uPath.value = 1; u.uC.value.copy(_c); u.uCR.value = CR; u.uSc.value = sc; u.uHead.value = head; u.uBL.value = BL; u.uA0.value = F.aE;
    u.uRip.value = 0;
    this._pathMesh(r);
    if (head < BL) bez(r.head, B0, B1, B2, head / BL); else r.head.set(_c.x + Math.sin(F.aE + (head - BL) / CR) * CR, _c.y, _c.z + Math.cos(F.aE + (head - BL) / CR) * CR);
    // (seen coming at them: full; it settles to their own fainter look as it wraps)
    const k0 = Math.min(1, r.pt / 0.06);
    if (r.self) { u.uAlpha.value = k0 * (1 + (SELF_A - 1) * wrap); r.band.visible = true; r.bandX.visible = false; } else this._alpha(r, k0);
    if (wrap >= 1) { r.phase = 'band'; r.spin = F.aE % TAU; r.pt = POP; this._band(r, a, 0, me, vt, cam); }   // (round them from this frame on)
  }
  // the going: the ripple (round them, growing), then the fly-away (the tail leads off the circle, up and out, fading;
  // uPath −1); splatted: a short, sharp ripple, fading where they fell
  _exit(r, a, dt, cam) {
    const u = r.U;
    if (r.phase === 'rip') {
      if (a.alive) this._centre(r, a, dt, cam);   // (round them while they're there)
      r.spin = (r.spin + SPIN * dt) % TAU;
      const sc = r.scl, R = BAND_R * sc, C = r.c;
      for (const m of [r.band, r.bandX]) { m.position.copy(C); m.rotation.y = r.spin; m.scale.set(R, sc, R); }
      u.uPath.value = 0; u.uRip.value = 0.14 * smooth(0, RIPPLE_T, r.pt); u.uRipT.value = this.time;
      r.band.userData.moving = true;
      this._alpha(r, 1);
      if (r.pt >= RIPPLE_T) {
        const aT = r.spin, ox = Math.sin(aT), oz = Math.cos(aT), tx = -Math.cos(aT), tz = Math.sin(aT);   // (out from them; the tail's way off)
        const B0 = new THREE.Vector3(C.x + ox * R, C.y, C.z + oz * R);
        const B1 = new THREE.Vector3(B0.x + tx * 0.6 * sc + ox * 0.3, B0.y + 0.35, B0.z + tz * 0.6 * sc + oz * 0.3);
        const B2 = new THREE.Vector3(B0.x + tx * 1.5 * sc + ox * 1.2, B0.y + 2.3, B0.z + tz * 1.5 * sc + oz * 1.2);
        r.ex = { C: C.clone(), CR: R, sc, aT, B0, B1, B2, BL: bezLen(B0, B1, B2) };
        r.phase = 'exit'; r.pt = 0;
      }
      return;
    }
    if (r.phase === 'exit') {
      const E = r.ex, k = Math.min(1, r.pt / EXIT_T), L = ARC * BAND_R * E.sc;
      u.uPath.value = -1; u.uC.value.copy(E.C); u.uCR.value = E.CR; u.uSc.value = E.sc; u.uA0.value = E.aT;
      u.uB0.value.copy(E.B0); u.uB1.value.copy(E.B1); u.uB2.value.copy(E.B2); u.uBL.value = E.BL;
      u.uHead.value = (E.BL + L + 0.3) * k * k;
      u.uRip.value = 0.06 * (1 - k); u.uRipT.value = this.time;
      this._pathMesh(r);
      bez(r.head, E.B0, E.B1, E.B2, Math.min(1, u.uHead.value / E.BL));   // (the tail, leading off: tests)
      this._alpha(r, 1 - smooth(0.35, 1, k));
      if (k >= 1) this._hide(r);
      return;
    }
    if (r.phase === 'die') {
      const k = Math.min(1, r.pt / DIE_T);
      r.spin = (r.spin + SPIN * dt) % TAU;
      const R = BAND_R * r.scl;
      for (const m of [r.band, r.bandX]) { m.position.copy(r.c); m.rotation.y = r.spin; m.scale.set(R, r.scl * (1 - 0.5 * k), R); }
      u.uPath.value = 0; u.uRip.value = 0.22 * Math.min(1, k * 3); u.uRipT.value = this.time;
      r.band.userData.moving = true;
      this._alpha(r, 1 - k);
      if (k >= 1) this._hide(r);
    }
  }
  _hide(r) {
    r.phase = 'off'; r.fly = null; r.ex = null;
    r.band.visible = r.bandX.visible = false; r.band.userData.moving = false;
    if (r.line) r.line.visible = false;
  }
  // its size from the camera's distance: as it is within GROW_FROM m, then growing gently, × GROW_MAX at most
  _growth(c, cam) { return Math.min(GROW_MAX, 1 + Math.max(0, cam.position.distanceTo(c) - GROW_FROM) * GROW_PER_M); }
  // the tracking team's line: your chest → theirs, through walls, in your colour
  _line(r, a, me, k = 1) {
    const l = r.line || (r.line = this._mkLine());
    me.visualPos ? me.visualPos(_s) : _s.copy(me.pos); _s.y += chestY(me);
    a.visualPos ? a.visualPos(_e) : _e.copy(a.pos); _e.y += chestY(a);
    _c.set(_e.x - _s.x, 0, _e.z - _s.z);
    const d = _c.length();
    if (d > 1e-3) _s.addScaledVector(_c, Math.min(LINE_OFF, d * 0.5) / d);
    r.from.copy(_s); r.to.copy(_e);
    const buf = l.geometry.attributes.instanceStart.data;
    buf.array[0] = _s.x; buf.array[1] = _s.y; buf.array[2] = _s.z; buf.array[3] = _e.x; buf.array[4] = _e.y; buf.array[5] = _e.z;
    buf.needsUpdate = true;
    const m = l.material;
    m.color.copy(G.teamColors[me.team]);
    m.opacity = LINE_A * Math.min(1, (this.time - r.t0) / POP) * Math.max(0, k);
    m.resolution.set(innerWidth || 1, innerHeight || 1);   // (CSS px: the same width at any render scale)
    l.visible = true;
  }
  _mkLine() {
    const g = new LineGeometry(); g.setPositions([0, 0, 0, 0, 0, 1]);
    const m = new LineMaterial({ color: 0xffffff, linewidth: LINE_PX, transparent: true, opacity: LINE_A, depthTest: false, depthWrite: false });
    const l = noAO(new Line2(g, m));
    l.frustumCulled = false; l.renderOrder = 8; l.visible = false;
    this.scene.add(l);
    return l;
  }
  // one poison particle off `a`: a bubble (55 %) or a wisp, from round the body, rising
  _spawn(a) {
    if (this.parts.length >= MAXP) return;
    const squid = a.form === 'squid', ang = rnd() * Math.PI * 2, rr = 0.12 + rnd() * 0.26;
    const bub = rnd() < 0.55;
    const h = squid ? 0.08 + rnd() * 0.4 : 0.3 + rnd() * 1.05;
    a.visualPos ? a.visualPos(_p) : _p.copy(a.pos);
    this.parts.push({
      x: _p.x + Math.cos(ang) * rr, y: _p.y + h, z: _p.z + Math.sin(ang) * rr,
      vx: Math.cos(ang) * 0.12 + a.vel.x * 0.25, vy: (bub ? 0.5 : 0.35) + rnd() * 0.45, vz: Math.sin(ang) * 0.12 + a.vel.z * 0.25,
      bub, t: 0, life: bub ? 0.9 + rnd() * 0.5 : 1.2 + rnd() * 0.6, size: (bub ? 0.1 + rnd() * 0.08 : 0.28 + rnd() * 0.16) * (a === G.local ? SELF_SIZE : 1), seed: rnd(),
    });
    this.stats.emitted++;
  }
  _stepParts(dt) {
    const P = this.parts, ap = this.aP.array, ad = this.aD.array;
    let n = 0;
    for (let i = P.length - 1; i >= 0; i--) {
      const q = P[i];
      q.t += dt;
      if (q.t >= q.life) { P[i] = P[P.length - 1]; P.pop(); continue; }
    }
    for (const q of P) {
      const u = q.t / q.life;
      // bubbles wobble up and pop; wisps drift, swell and thin out
      const wob = q.bub ? Math.sin(q.t * 9 + q.seed * 20) * 0.25 : Math.sin(q.t * 2.5 + q.seed * 10) * 0.12;
      q.x += (q.vx + wob * 0.6) * dt; q.y += q.vy * dt; q.z += (q.vz + wob * 0.4) * dt;
      q.vx *= 1 - dt * 1.5; q.vz *= 1 - dt * 1.5;
      const o = n * 4;
      ap[o] = q.x; ap[o + 1] = q.y; ap[o + 2] = q.z;
      ap[o + 3] = q.bub ? q.size * (0.7 + 0.3 * Math.min(1, u * 5)) * (u > 0.88 ? 1.25 : 1) : q.size * (0.6 + 0.9 * u);
      ad[o] = q.bub ? Math.min(1, u * 8) * (u > 0.9 ? Math.max(0, 1 - (u - 0.9) * 10) : 1) : Math.min(1, u * 5) * (1 - u) * 1.2;
      ad[o + 1] = q.bub ? 0 : 1; ad[o + 2] = q.seed; ad[o + 3] = u;
      n++;
    }
    this.partMesh.geometry.instanceCount = n;
    this.partMesh.visible = n > 0;
    if (n) { this.aP.needsUpdate = true; this.aD.needsUpdate = true; }
  }
  _drop(r) {
    this.scene.remove(r.band, r.bandX);
    for (const m of [...r.band.material, ...r.bandX.material]) m.dispose();
    if (r.line) { this.scene.remove(r.line); r.line.material.dispose(); r.line.geometry.dispose(); }
    this.recs.delete(r.a);
  }
  // a new match / everything cleared: no looks left over
  clear() {
    for (const r of [...this.recs.values()]) this._drop(r);
    this.pending.clear(); this.marks.clear();
    this.parts.length = 0;
    this.partMesh.geometry.instanceCount = 0; this.partMesh.visible = false;
  }
}
