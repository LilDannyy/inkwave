// [b5-karp] Bazookarp's look (SPEC §6.7; [karp-face] the finished one). Built and cleared on 'match:state' like TowerFx;
// update(dt) each frame (main.js). Everything here is visual: nothing collides, nothing decides.
//   the Roe Shell     an iridescent fish-egg membrane (the bubble family): the leading team's ink swirls in from its side
//                     as the meter climbs, it swells, cracks above 60 %, flashes white above 75 %; a gold yolk glow inside
//                     round the resting carp. The burst: shards and a shock ring out to the 4.5 m splat radius
//   the Bazookarp     resting: the koi itself (karpModel.js) turning slowly over its floor inside the shell, white-gold;
//                     free: brighter, sparkling; held: the carrier's own 'sp_karp' (character.js) — droplets off its fins,
//                     its mouth glows with the charge (the model); swimming: the wake glow (below). Resetting: a gold comet
//                     arcing to the Pond, a splash where it lands
//   the light pillar  over it, like the tower's: gold while unheld, the carrier's ink while held; hidden from the enemy
//                     while the carrier swims (S31: it would show through walls)
//   the wake glow     a carp-shaped shimmer on the ink under a swimming carrier (depth-tested) with ripples
//   weirs             a falling-ink curtain between the posts in the attacking team's ink, lit carp-head caps; lowering:
//                     the curtain drains (0.6 s) and the caps sink 0.6 m (1.2 s) and go grey
//   Dragon Gates      sealed: a dark lid on the plinth; opening: a carp-dragon arch rises between the posts (1.4 s) with
//                     a column of light in the attacking team's ink; a knockout: fireworks
//   free zones        hatching on the floor inside the polygon and height band in the owner's ink, an outline, and lit
//                     NO CARP boards on the signs
//   carrierBlock      a faint shimmering curtain along its edges (only carriers are held out), brighter for a carrier near
//   Carp Shots        a glossy ink ball with a trail; landed: a ring that swells to the blast radius over the 0.45 s swell
//                     (the honest tell), the ball wobbling; the blast; a Big Burst throws up a spinning water-spout
//   the Carp Blast    the last 3 s: the carp hisses and steams, a red ring at 4.5 m round the carrier; then a huge burst in
//                     the enemy's ink with its ring
//   the arc preview   (the local carrier, charging) dashes flowing along the arc, the landing ring at the blast radius
import * as THREE from 'three';
import { G, on, emit } from '../core/ctx.js';
import { BAZOOKARP as K } from '../config.js';
import { launch, radiusOf } from '../game/karpGun.js';
import { karpRestMesh } from '../game/karpModel.js';

const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _c = new THREE.Color(), _c2 = new THREE.Color(), _q = new THREE.Quaternion();
const GOLD = new THREE.Color('#ffd27a'), GREY = new THREE.Color('#8b8697'), WHITE = new THREE.Color('#ffffff'), RED = new THREE.Color('#ff4a3a');
const UP = new THREE.Vector3(0, 1, 0);
const glow = (color, opacity = 1, o = {}) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false, ...o });
const basic = (color, o = {}) => new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, ...o });
// transparent overlays stay out of the GTAO normal / depth pass (scene.overrideMaterial), like the zone marks
function noAO(mesh) { mesh.onBeforeRender = (r, scene, cam, geo) => { geo.drawRange.count = scene.overrideMaterial ? 0 : Infinity; }; return mesh; }
const ease = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };

// ---- shaders
const SHELL_VS = `
  varying vec3 vN; varying vec3 vW; varying vec3 vL;
  void main(){ vL = position; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * w; }`;
const SHELL_FS = `
  uniform vec3 uColA; uniform vec3 uColB; uniform float uM; uniform vec3 uDirA; uniform float uFlash; uniform float uTime; uniform float uGrow; uniform float uWarn;
  varying vec3 vN; varying vec3 vW; varying vec3 vL;
  float h3(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
  float n3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
  // cracks: the edges of a cell pattern
  float cracks(vec3 p){ vec3 i = floor(p), f = fract(p); float d1 = 9.0, d2 = 9.0;
    for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) { vec3 g = vec3(x, y, z), o = vec3(h3(i + g), h3(i + g + 7.1), h3(i + g + 3.7));
      float d = length(g + o - f); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
    return 1.0 - smoothstep(0.0, 0.035, d2 - d1); }
  void main(){
    vec3 V = normalize(cameraPosition - vW), N = normalize(vN);
    float fr = pow(1.0 - abs(dot(V, N)), 2.2);
    vec3 dir = normalize(vL);
    // iridescence: a thin-film hue sweep with the view angle and a slow swirl
    float sw = n3(dir * 2.6 + vec3(0.0, uTime * 0.35, 0.0)) * 0.6 + n3(dir * 6.0 - uTime * 0.2) * 0.4;
    vec3 iri = 0.55 + 0.45 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + fr * 1.4 + sw * 0.8));
    // the leading team's ink pours in from its side: a swirling front, deeper as the meter climbs
    float k = abs(uM), side = dot(dir, uM >= 0.0 ? uDirA : -uDirA);
    float front = side + 1.15 - 2.3 * k + (sw - 0.5) * 0.55 + 0.12 * sin(atan(dir.z, dir.x) * 5.0 + uTime * 2.0);
    float ink = smoothstep(0.0, 0.22, front) * step(0.02, k);
    vec3 col = mix(vec3(1.0), iri, 0.55);
    col = mix(col, uM >= 0.0 ? uColA : uColB, ink * 0.85);
    float a = 0.08 + 0.55 * fr + ink * (0.26 + 0.22 * k);
    // cracks above 60 %, the white warning flash above 75 %
    float cr = cracks(dir * 3.2) * smoothstep(0.6, 0.85, k) * (0.3 + 0.7 * ink);
    col = mix(col, vec3(1.0), cr * 0.9); a = max(a, cr * 0.75);
    float warn = uWarn * (0.5 + 0.5 * sin(uTime * 22.0));
    col = mix(col, vec3(1.0), clamp(uFlash * 0.7 + warn * 0.45, 0.0, 1.0)); a = min(1.0, a + uFlash * 0.25 + warn * 0.12);
    // a glossy highlight
    vec3 L = normalize(vec3(0.4, 0.8, 0.3)); float sp = pow(max(0.0, dot(reflect(-L, N), V)), 40.0);
    col += sp * 0.8; a = min(1.0, a + sp * 0.6);
    gl_FragColor = vec4(col, a * uGrow);
  }`;
const CURTAIN_VS = `varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const CURTAIN_FS = `
  uniform vec3 uCol; uniform float uTime; uniform float uDrain; uniform float uSeed;
  varying vec2 vU;
  float h1(float x){ return fract(sin(x * 91.7 + uSeed) * 43758.5453); }
  void main(){
    float top = 1.0 - uDrain;                       // draining: the top edge falls
    if (vU.y > top) discard;
    float col = floor(vU.x * 46.0), fx = fract(vU.x * 46.0);
    float sp = 0.7 + 0.6 * h1(col), ph = h1(col + 3.0);
    float streak = fract(vU.y * 3.0 + uTime * sp * 1.6 + ph);
    float s = smoothstep(0.0, 0.2, streak) * (1.0 - smoothstep(0.55, 1.0, streak));
    float thread = 1.0 - smoothstep(0.25, 0.5, abs(fx - 0.5));
    float a = (0.28 + 0.45 * s) * (0.55 + 0.45 * thread);
    a *= smoothstep(0.0, 0.05, vU.x) * smoothstep(1.0, 0.95, vU.x) * smoothstep(top, top - 0.06, vU.y);
    float foam = smoothstep(0.12, 0.0, vU.y);
    vec3 c = mix(uCol, vec3(1.0), 0.25 * s + foam * 0.5);
    gl_FragColor = vec4(c, min(1.0, a + foam * 0.35));
  }`;
const COLUMN_VS = `varying vec2 vU; varying vec3 vN; varying vec3 vW; void main(){ vU = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`;
// a light column: bright at its silhouette, faint through the middle, rings rising; fading up, and (uNear) fading out
// as the camera comes close (the carrier's own pillar never fills the screen)
const COLUMN_FS = `
  uniform vec3 uCol; uniform float uTime; uniform float uA; uniform float uFoot;
  varying vec2 vU; varying vec3 vN; varying vec3 vW;
  void main(){
    vec3 V = normalize(cameraPosition - vW);
    float rim = 1.0 - abs(dot(normalize(vN), V));
    float rise = fract(vU.y * 4.0 - uTime * 0.7);
    float band = smoothstep(0.0, 0.1, rise) * (1.0 - smoothstep(0.2, 0.5, rise));
    float near = smoothstep(3.5, 9.0, length(cameraPosition.xz - vW.xz));
    float a = (0.06 + 0.55 * rim * rim + 0.3 * band) * (1.0 - vU.y) * (1.0 - vU.y) * smoothstep(0.0, uFoot, vU.y) * uA * near;
    gl_FragColor = vec4(mix(uCol, vec3(1.0), 0.3 * band + 0.25 * rim), a);
  }`;
const ZONE_VS = `attribute vec2 aE; varying vec2 vW; varying float vE; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xz; vE = aE.x;
  gl_Position = projectionMatrix * viewMatrix * w; }`;
const ZONE_FS = `
  uniform vec3 uCol; uniform float uTime;
  varying vec2 vW; varying float vE;
  void main(){
    float d = fract((vW.x + vW.y) * 0.9 + uTime * 0.12);
    float hatch = smoothstep(0.0, 0.08, d) * (1.0 - smoothstep(0.28, 0.36, d));
    float edge = smoothstep(0.75, 1.0, vE);
    gl_FragColor = vec4(uCol, 0.12 + 0.2 * hatch + 0.5 * edge);
  }`;
const BLOCK_VS = `varying vec2 vU; varying vec3 vW; void main(){ vU = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const BLOCK_FS = `
  uniform float uTime; uniform float uA;
  varying vec2 vU; varying vec3 vW;
  void main(){
    float w = sin(vW.x * 3.0 + vW.z * 3.0 + vW.y * 4.0 - uTime * 3.0) * 0.5 + 0.5;
    float hex = abs(sin(vW.y * 9.0 + sin(vW.x * 2.0 + vW.z * 2.0) * 2.0 + uTime));
    float a = (0.05 + 0.1 * w + 0.12 * smoothstep(0.9, 1.0, hex)) * (1.0 - vU.y) * uA;
    gl_FragColor = vec4(mix(vec3(0.75, 0.9, 1.0), vec3(1.0), w), a);
  }`;
const WAKE_FS = `
  uniform vec3 uCol; uniform float uTime; uniform float uA;
  varying vec2 vU;
  void main(){
    vec2 p = vU * 2.0 - 1.0;                       // x across, y along (+y = the head)
    float body = length(vec2(p.x / (0.36 * (1.0 - 0.35 * max(0.0, -p.y))), (p.y - 0.12) / 0.62));
    float tail = length(vec2((abs(p.x) - 0.25 * (-p.y - 0.62)) / 0.12, (p.y + 0.78) / 0.16));
    float shape = min(body, max(tail, step(-0.55, p.y) * 9.0));
    float fish = 1.0 - smoothstep(0.75, 1.0, shape);
    float rim = smoothstep(0.6, 0.9, shape) * (1.0 - smoothstep(0.9, 1.1, shape));
    float r = length(p); float rip = (1.0 - smoothstep(0.0, 0.06, abs(fract(r * 2.2 - uTime * 1.6) - 0.5) - 0.3)) * (1.0 - smoothstep(0.6, 1.0, r));
    float a = (fish * 0.45 + rim * 0.5 + rip * 0.22) * uA;
    gl_FragColor = vec4(mix(uCol, vec3(1.0), rim * 0.5 + fish * 0.2), a);
  }`;
const SPOUT_FS = `
  uniform vec3 uCol; uniform float uTime; uniform float uA;
  varying vec2 vU;
  void main(){
    float s = fract(vU.x * 3.0 + vU.y * 2.2 - uTime * 2.4);
    float band = smoothstep(0.0, 0.15, s) * (1.0 - smoothstep(0.35, 0.6, s));
    float a = (0.25 + 0.55 * band) * smoothstep(0.0, 0.12, vU.y) * (1.0 - smoothstep(0.7, 1.0, vU.y)) * uA;
    gl_FragColor = vec4(mix(uCol, vec3(1.0), 0.4 * band + 0.2), a);
  }`;

// the NO CARP board (canvas): a crossed-out carp over "NO CARP", rimmed in the owner's ink
function signTexture(hex) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 176;
  const x = cv.getContext('2d');
  x.fillStyle = '#15121c'; x.beginPath(); x.roundRect(4, 4, 248, 168, 22); x.fill();
  x.fillStyle = '#f4ecdc'; x.beginPath(); x.roundRect(14, 14, 228, 148, 16); x.fill();
  x.strokeStyle = hex; x.lineWidth = 9; x.beginPath(); x.roundRect(14, 14, 228, 148, 16); x.stroke();
  // the carp
  x.save(); x.translate(128, 70); x.fillStyle = '#ffb83a'; x.strokeStyle = '#15121c'; x.lineWidth = 5;
  x.beginPath(); x.moveTo(-58, 0); x.quadraticCurveTo(-10, -34, 40, -14); x.quadraticCurveTo(58, -6, 60, 0); x.quadraticCurveTo(58, 6, 40, 14); x.quadraticCurveTo(-10, 34, -58, 0); x.closePath(); x.fill(); x.stroke();
  x.beginPath(); x.moveTo(-52, 0); x.lineTo(-74, -18); x.quadraticCurveTo(-66, 0, -74, 18); x.closePath(); x.fill(); x.stroke();
  x.fillStyle = '#15121c'; x.beginPath(); x.arc(42, -4, 4.5, 0, 7); x.fill();
  x.restore();
  // the cross-out
  x.strokeStyle = '#e8322b'; x.lineWidth = 12; x.lineCap = 'round';
  x.beginPath(); x.arc(128, 70, 50, 0, 7); x.stroke();
  x.beginPath(); x.moveTo(93, 105); x.lineTo(163, 35); x.stroke();
  x.fillStyle = '#15121c'; x.font = "400 34px 'Titan One', 'Rubik', sans-serif"; x.textAlign = 'center'; x.fillText('NO CARP', 128, 154);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
const pointIn = (poly, x, z) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };
const segDist = (poly, x, z) => { let d = Infinity; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [ax, az] = poly[j], [bx, bz] = poly[i], ux = bx - ax, uz = bz - az, L = ux * ux + uz * uz || 1; const t = Math.min(1, Math.max(0, ((x - ax) * ux + (z - az) * uz) / L)); d = Math.min(d, Math.hypot(x - ax - ux * t, z - az - uz * t)); } return d; };

export class BazookarpFx {
  constructor(scene) {
    this.scene = scene; this.root = null; this.match = null; this.K = null;
    this.shots = new Map(); this.bursts = [];
    this._unsubs = [
      on('match:state', ({ state, match }) => {
        if (!match || match.attract || !match.karp) { if (match !== this.match || state === 'intro') this.clear(); return; }
        if (match !== this.match) this.build(match);
        if (state === 'results') this.clear();
      }),
      on('karp:burst', ({ team, pos }) => this._onBurst(team, pos)),
      on('karp:blast', ({ pos, radius, charge, actor }) => this._onBlast(pos, radius, charge, actor)),
      on('karp:explode', ({ actor, pos }) => this._onExplode(actor, pos)),
      on('karp:plant', ({ team, index }) => this._onPlant(team, index)),
      on('karp:gate', ({ team }) => { const g = this.gates?.[team]; if (g && g.up < 0) g.up = 0; }),
      on('karp:end', ({ winner, reason }) => { if (reason === 'knockout') this._onKnockout(winner); }),
      on('karp:reset', () => { this._comet = 0; }),
      on('karp:phase', ({ phase, prev }) => { if (prev === 'resetting' && phase === 'reforming') this._splashAt(this.K?.R.pond, GOLD, 1.6); }),
    ];
    G.karpFx = this;
  }
  clear() {
    if (this.root) {
      this.scene.remove(this.root);
      this.root.traverse((o) => { o.geometry?.dispose?.(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.map?.dispose?.(); m.dispose(); }); });
    }
    this.root = null; this.match = null; this.K = null; this.shots.clear(); this.bursts.length = 0;
  }
  dispose() { this.clear(); this._unsubs.forEach((u) => u()); }
  _col(t) { return G.teamColors?.[t] || WHITE; }
  _hex(t) { return G.teamHex?.[t] || '#ffffff'; }

  build(match) {
    this.clear();
    const Kp = match.karp;
    if (!Kp || !G.level) return;
    this.match = match; this.K = Kp;
    const root = (this.root = new THREE.Group());
    root.name = 'bazookarpFx';
    // ---- the shell, the yolk glow, the resting carp
    this.shellU = { uColA: { value: this._col(0).clone() }, uColB: { value: this._col(1).clone() }, uM: { value: 0 }, uDirA: { value: new THREE.Vector3(0, 0, -1) }, uFlash: { value: 0 }, uTime: { value: 0 }, uGrow: { value: 1 }, uWarn: { value: 0 } };
    this.shell = noAO(new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.ShaderMaterial({ uniforms: this.shellU, vertexShader: SHELL_VS, fragmentShader: SHELL_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide })));
    this.shell.renderOrder = 3;
    this.yolk = noAO(new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), glow(GOLD, 0.18)));
    root.add(this.shell, this.yolk);
    // which way each team's ink pours in from: the shell's side facing that team's pad
    const pa = G.level.spawnPads[0];
    this.shellU.uDirA.value.set(pa.x, 0, pa.z).normalize();
    this.carp = karpRestMesh();
    root.add(this.carp);
    this.halo = noAO(new THREE.Mesh(new THREE.RingGeometry(0.55, 0.62, 40), glow(GOLD, 0.6, { side: THREE.DoubleSide })));
    this.halo.rotation.x = -Math.PI / 2; root.add(this.halo);
    // ---- the light pillar (a column with rings rising up it)
    this.pillarU = { uCol: { value: GOLD.clone() }, uTime: { value: 0 }, uA: { value: 1 }, uFoot: { value: 0.06 } };
    this.pillar = noAO(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 40, 16, 1, true), new THREE.ShaderMaterial({ uniforms: this.pillarU, vertexShader: COLUMN_VS, fragmentShader: COLUMN_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })));
    root.add(this.pillar);
    // ---- the wake glow (a carp on the ink)
    this.wakeU = { uCol: { value: GOLD.clone() }, uTime: { value: 0 }, uA: { value: 1 } };
    this.wake = noAO(new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.6), new THREE.ShaderMaterial({ uniforms: this.wakeU, vertexShader: CURTAIN_VS, fragmentShader: WAKE_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 })));
    this.wake.visible = false; root.add(this.wake);
    // ---- the carrier's warning ring (the last 3 s of the fuse) and the arc preview
    this.warnRing = noAO(new THREE.Mesh(new THREE.RingGeometry(0.94, 1, 64), glow(RED, 0.8, { side: THREE.DoubleSide })));
    this.warnRing.rotation.x = -Math.PI / 2; this.warnRing.visible = false; root.add(this.warnRing);
    // ---- weirs: a curtain between the posts, a carp-head cap on each post
    this.weirs = [];
    for (const list of Kp.weirs) for (const w of list) {
      const U = { uCol: { value: this._col(w.team).clone() }, uTime: { value: 0 }, uDrain: { value: 0 }, uSeed: { value: Math.random() * 10 } };
      const cur = noAO(new THREE.Mesh(new THREE.PlaneGeometry(4.9, 2.3), new THREE.ShaderMaterial({ uniforms: U, vertexShader: CURTAIN_VS, fragmentShader: CURTAIN_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide })));
      cur.position.set(w.pos.x, w.pos.y + 1.2, w.pos.z); cur.rotation.y = w.yaw;
      const ax = Math.cos(w.yaw), az = -Math.sin(w.yaw);
      // ([karp-face] each cap sits on its own post's top, read from the level: the weir's floor can be its sill's top)
      const tops = [-1, 1].map((s) => { const t = G.level.groundHeight(w.pos.x + ax * 2.7 * s, w.pos.z + az * 2.7 * s, w.pos.y + 4); return Number.isFinite(t) && t > w.pos.y + 1.2 ? t - 0.05 : w.pos.y + 2.35; });
      const capY = Math.max(...tops);
      const caps = [-1, 1].map((s, i) => {
        const g = this._capMesh(this._col(w.team));
        g.position.set(w.pos.x + ax * 2.7 * s, tops[i], w.pos.z + az * 2.7 * s); g.rotation.y = w.yaw + (s > 0 ? Math.PI / 2 : -Math.PI / 2);
        root.add(g); return g;
      });
      const lip = noAO(new THREE.Mesh(new THREE.PlaneGeometry(4.9, 0.8), glow(this._col(w.team), 0.35, { side: THREE.DoubleSide })));
      lip.position.set(w.pos.x, w.pos.y + 0.08, w.pos.z); lip.rotation.set(-Math.PI / 2, 0, -w.yaw); lip.rotation.order = 'YXZ'; lip.rotation.y = w.yaw;
      root.add(cur, lip);
      this.weirs.push({ w, cur, U, caps, lip, low: Kp.lowered[w.team] ? 1.2 : -1, y0: capY });
    }
    // ---- Dragon Gates: the lid, the arch, the column, a floor ring
    this.gates = Kp.gates.map((g) => {
      const col = this._col(g.team), grp = new THREE.Group();
      grp.position.copy(g.pos); grp.rotation.y = g.yaw; root.add(grp);
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.6, 0.06, 40), new THREE.MeshStandardMaterial({ color: '#2b2733', roughness: 0.6, metalness: 0.3 }));
      lid.position.y = 0.18; grp.add(lid);
      const seal = noAO(new THREE.Mesh(new THREE.RingGeometry(0.5, 0.62, 6), basic(col, { opacity: 0.85, side: THREE.DoubleSide })));
      seal.rotation.x = -Math.PI / 2; seal.position.y = 0.22; grp.add(seal);
      const arch = this._archMesh(col); arch.position.y = 0; arch.scale.set(1, 0.001, 1); arch.visible = false; grp.add(arch);
      const U = { uCol: { value: col.clone() }, uTime: { value: 0 }, uA: { value: 0 }, uFoot: { value: 0.01 } };
      const column = noAO(new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, 14, 28, 1, true), new THREE.ShaderMaterial({ uniforms: U, vertexShader: COLUMN_VS, fragmentShader: COLUMN_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })));
      column.position.y = 7.15; column.visible = false; grp.add(column);
      const ring = noAO(new THREE.Mesh(new THREE.RingGeometry(1.62, 1.75, 48), basic(col, { opacity: 0.55, side: THREE.DoubleSide })));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.17; grp.add(ring);
      return { g, grp, lid, seal, arch, column, U, ring, up: Kp.gateUp[g.team] ? 1.4 : -1 };
    });
    // ---- free zones: hatched floor (a grid inside the polygon and band), an outline; lit NO CARP boards
    this.zoneU = [0, 1].map((t) => ({ uCol: { value: this._col(t).clone() }, uTime: { value: 0 } }));
    for (const t of [0, 1]) for (const z of Kp.R.zones[t]) { const m = this._zoneMesh(z, t); if (m) root.add(m); }
    this.boards = [];
    const tex = [this._hex(0), this._hex(1)].map((h) => signTexture(h));
    for (const s of Kp.field.signs) {
      const y = s.y > -50 ? s.y : 0, a = ((s.yaw ?? 0) * Math.PI) / 180;
      if (s.auto) {   // (the placeholder's own posts: data signs are level pieces)
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.95, 0.14), new THREE.MeshStandardMaterial({ color: '#9d978c', roughness: 0.8 }));
        post.position.set(s.x, y + 0.97, s.z); root.add(post);
      }
      const b = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.6), new THREE.MeshBasicMaterial({ map: tex[s.team], side: THREE.DoubleSide, toneMapped: false }));
      b.position.set(s.x, y + 1.58, s.z); b.rotation.y = a;
      root.add(b); this.boards.push(b);
    }
    // ---- carrierBlock shimmer
    this.blockU = { uTime: { value: 0 }, uA: { value: 0.6 } };
    for (const v of Kp.R.carrierBlock || []) root.add(this._blockMesh(v));
    // ---- the arc preview: flowing dashes, the landing ring over a disc
    this.arcDots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 8, 6), basic('#ffffff', { opacity: 0.95 }), 28);
    this.arcDots.visible = false; this.arcDots.frustumCulled = false;
    this.arcRing = noAO(new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 48), basic('#ffffff', { opacity: 0.9, side: THREE.DoubleSide })));
    this.arcRing.rotation.x = -Math.PI / 2; this.arcRing.visible = false;
    this.arcDisc = noAO(new THREE.Mesh(new THREE.CircleGeometry(0.9, 48), basic('#ffffff', { opacity: 0.22, side: THREE.DoubleSide })));
    this.arcDisc.rotation.x = -Math.PI / 2; this.arcDisc.visible = false;
    root.add(this.arcDots, this.arcRing, this.arcDisc);
    this._m4 = new THREE.Matrix4(); this._arcT = 0;
    // ---- shots
    this.shotGeo = new THREE.SphereGeometry(0.24, 16, 12);
    this.ringGeo = new THREE.RingGeometry(0.93, 1, 48);
    this.discGeo = new THREE.CircleGeometry(1, 40);
    this.spoutGeo = new THREE.CylinderGeometry(0.35, 1.1, 4.5, 20, 1, true);
    this.spoutGeo.translate(0, 2.25, 0);
    this.ringFx = [];   // expanding shock rings (burst, blast, Carp Blast)
    this.spouts = [];
    this.scene.add(root);
  }

  // a carp-head cap for a weir post: a gold head with eyes, lit, its mouth up
  _capMesh(col) {
    const g = new THREE.Group();
    const gold = new THREE.MeshStandardMaterial({ color: '#f2c14e', roughness: 0.35, metalness: 0.4, emissive: '#7a5410', emissiveIntensity: 0.3 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 14), gold); head.scale.set(1, 0.85, 1.25); head.position.set(0, 0.28, 0); g.add(head);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.06, 8, 20), new THREE.MeshStandardMaterial({ color: '#f7958a', roughness: 0.4 })); lip.position.set(0, 0.32, 0.42); g.add(lip);
    for (const s of [1, -1]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2 })); e.position.set(s * 0.26, 0.4, 0.2); g.add(e);
      const k = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 6), new THREE.MeshBasicMaterial({ color: '#15121c' })); k.position.set(s * 0.31, 0.42, 0.24); g.add(k);
    }
    const lamp = noAO(new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), glow(col, 0.9))); lamp.position.set(0, 0.32, 0.44); g.add(lamp);
    g.userData = { gold, lamp };
    return g;
  }
  // the carp-dragon arch: a half ring between the posts (radius 2.2, on the posts' tops), a dragon-carp head at its crown
  _archMesh(col) {
    const g = new THREE.Group();
    const ink = new THREE.MeshStandardMaterial({ color: col, roughness: 0.3, metalness: 0.2, emissive: col, emissiveIntensity: 0.35 });
    const gold = new THREE.MeshStandardMaterial({ color: '#f2c14e', roughness: 0.3, metalness: 0.5, emissive: '#6a4a10', emissiveIntensity: 0.3 });
    const arc = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.22, 10, 40, Math.PI), ink); arc.position.y = 3.2; g.add(arc);
    for (let k = 0; k < 9; k++) { const a = (k + 0.5) / 9 * Math.PI, s = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.5, 6), gold); s.position.set(Math.cos(a) * 2.42, 3.2 + Math.sin(a) * 2.42, 0); s.rotation.z = a - Math.PI / 2; g.add(s); }
    const head = new THREE.Group(); head.position.set(0, 5.55, 0.1); g.add(head);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14), gold); skull.scale.set(1, 0.8, 1.3); head.add(skull);
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.08, 8, 20), new THREE.MeshStandardMaterial({ color: '#f7958a', roughness: 0.4 })); mouth.position.set(0, -0.05, 0.62); head.add(mouth);
    for (const s of [1, -1]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.6, 8), gold); horn.position.set(s * 0.26, 0.5, -0.15); horn.rotation.set(-0.5, 0, s * -0.3); head.add(horn);
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2 })); e.position.set(s * 0.36, 0.12, 0.32); head.add(e);
      const k = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 6), new THREE.MeshBasicMaterial({ color: '#15121c' })); k.position.set(s * 0.42, 0.13, 0.37); head.add(k);
      const wh = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.025, 6, 14, Math.PI * 0.9), gold); wh.position.set(s * 0.2, -0.32, 0.5); wh.rotation.set(0, s * 1.2, Math.PI); head.add(wh);
    }
    g.userData = { ink, gold };
    return g;
  }
  _zoneMesh(z, t) {
    const poly = z.poly; if (!poly || poly.length < 3) return null;
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const [x, zz] of poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, zz); z1 = Math.max(z1, zz); }
    const step = 0.75, nx = Math.max(1, Math.ceil((x1 - x0) / step)), nz = Math.max(1, Math.ceil((z1 - z0) / step));
    const yLo = (z.y0 ?? -1) - 0.2, yHi = (z.y1 ?? 30) + 0.2;
    const pos = [], edge = [], idx = [], id = new Map();
    const vert = (i, j) => {
      const k = i * (nz + 1) + j; if (id.has(k)) return id.get(k);
      const x = Math.min(x1, x0 + i * step), zz = Math.min(z1, z0 + j * step), y = G.level.groundHeight(x, zz, yHi + 0.5);
      if (!(y >= yLo && y <= yHi)) { id.set(k, -1); return -1; }
      const n = pos.length / 3; pos.push(x, y + 0.05, zz); edge.push(pointIn(poly, x, zz) ? Math.max(0, 1 - segDist(poly, x, zz) / 0.6) : 1, 0); id.set(k, n); return n;
    };
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const cx = x0 + (i + 0.5) * step, cz = z0 + (j + 0.5) * step;
      if (!pointIn(poly, cx, cz)) continue;
      const a = vert(i, j), b = vert(i + 1, j), c = vert(i, j + 1), d = vert(i + 1, j + 1);
      if (a < 0 || b < 0 || c < 0 || d < 0) continue;
      const ya = pos[a * 3 + 1], yb = pos[b * 3 + 1], yc = pos[c * 3 + 1], yd = pos[d * 3 + 1];
      if (Math.max(ya, yb, yc, yd) - Math.min(ya, yb, yc, yd) > 0.6) continue;   // (a step: no sheet across it)
      idx.push(a, c, b, b, c, d);
    }
    if (!idx.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aE', new THREE.Float32BufferAttribute(edge, 2)); g.setIndex(idx);
    const m = noAO(new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: this.zoneU[t], vertexShader: ZONE_VS, fragmentShader: ZONE_FS, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })));
    m.renderOrder = 1;
    return m;
  }
  _blockMesh(v) {
    const poly = v.poly, h = Math.max(1.5, Math.min(6, (v.y1 ?? 3) - (v.y0 ?? 0) + 1.5)), pos = [], uv = [], idx = [];
    for (let i = 0; i < poly.length; i++) {
      const [ax, az] = poly[i], [bx, bz] = poly[(i + 1) % poly.length], y = G.level.groundHeight((ax + bx) / 2, (az + bz) / 2, (v.y1 ?? 5) + 0.5);
      const y0 = y > -50 ? y : v.y0 ?? 0, n = pos.length / 3;
      pos.push(ax, y0, az, bx, y0, bz, ax, y0 + h, az, bx, y0 + h, bz); uv.push(0, 0, 1, 0, 0, 1, 1, 1); idx.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    return noAO(new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: this.blockU, vertexShader: BLOCK_VS, fragmentShader: BLOCK_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })));
  }

  // ---- one-shot looks
  _shock(pos, color, R, life = 0.5, y = 0.12) {
    if (!this.root) return;
    const m = noAO(new THREE.Mesh(this.ringGeo, glow(color, 0.9, { side: THREE.DoubleSide })));
    m.rotation.x = -Math.PI / 2; m.position.set(pos.x, pos.y + y, pos.z); m.scale.setScalar(0.3);
    this.root.add(m); this.ringFx.push({ m, R, t: 0, life });
  }
  _splashAt(p, color, R) { if (!p || !this.root) return; G.fx?.explosion?.(_v.copy(p).setY(p.y + 0.4), color, R); this._shock(p, color, R * 1.4, 0.45); G.fx?.burst?.(_v.copy(p).setY(p.y + 0.2), UP, color, { count: 26, speed: 6, size: 0.12 }); }
  _onBurst(team, pos) {
    if (!this.root || !pos) return;
    const col = this._col(team), c = _v2.copy(pos);
    G.fx?.burst?.(c, UP, WHITE, { count: 40, speed: 9, size: 0.14 });
    G.fx?.burst?.(c, UP, col, { count: 34, speed: 7, size: 0.13 });
    this._shock(_v.copy(c).setY(c.y - K.shell.lift), col, K.shell.burstR, 0.55);
    this._shock(_v.copy(c).setY(c.y - K.shell.lift), WHITE, K.shell.burstR * 0.75, 0.35);
    emitShake(c, 0.9);
  }
  _onBlast(pos, radius, charge, actor) {
    if (!this.root || !pos) return;
    const col = actor ? actor.color || this._col(actor.team) : WHITE;
    this._shock(_v.copy(pos).setY(pos.y - 0.3), col, radius, 0.4);
    if (charge >= 1) {   // a Big Burst's water-spout (the user's "tornado-like twister")
      const U = { uCol: { value: new THREE.Color(col) }, uTime: { value: 0 }, uA: { value: 1 } };
      const m = noAO(new THREE.Mesh(this.spoutGeo, new THREE.ShaderMaterial({ uniforms: U, vertexShader: CURTAIN_VS, fragmentShader: SPOUT_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide })));
      m.position.set(pos.x, pos.y - 0.35, pos.z); this.root.add(m); this.spouts.push({ m, U, t: 0 });
      emitShake(pos, 0.6);
    }
  }
  _onExplode(actor, pos) {
    if (!this.root || !pos || !actor) return;
    const col = this._col(1 - actor.team);
    this._shock(pos, col, K.explodeR, 0.7);
    this._shock(pos, WHITE, K.explodeR * 0.8, 0.45);
    G.fx?.burst?.(_v.copy(pos).setY(pos.y + 0.8), UP, col, { count: 60, speed: 11, size: 0.16 });
    emitShake(pos, 1.4);
  }
  _onPlant(team, index) {
    const w = this.weirs?.find((x) => x.w.team === team && x.w.index === index);
    if (w) this._splashAt(w.w.pos, this._col(team), 2.2);
    for (const x of this.weirs || []) if (x.w.team === team && x.low < 0) x.low = 0;
  }
  _onKnockout(winner) {
    const g = this.gates?.[winner]; if (!g) return;
    const col = this._col(winner);
    for (let k = 0; k < 6; k++) setTimeout(() => { if (!this.root) return; const p = _v.copy(g.g.pos).add(_v2.set((Math.random() - 0.5) * 6, 3 + Math.random() * 5, (Math.random() - 0.5) * 6)); G.fx?.explosion?.(p.clone(), k % 2 ? WHITE : col, 2.2); }, k * 180);
    this._shock(g.g.pos, col, 7, 0.9);
  }

  // is the carrier hidden from this screen's viewer (an enemy while it swims)?
  _hiddenFromViewer(H) { const me = G.match?.local; return !!(H && me && me.team !== H.team && this.K.hidden(H)); }

  update(dt) {
    const Kp = this.K;
    if (!this.root || !Kp || !this.match || this.match.karp !== Kp) return;
    const t = (this._t = (this._t || 0) + dt);
    const H = Kp.holder, sh = Kp.shell, hid = this._hiddenFromViewer(H);
    // ---- the shell
    const on = sh.state !== 'none';
    this.shell.visible = this.yolk.visible = on;
    if (on) {
      const r = Math.max(0.05, sh.radius()), k = sh.hp > 0 ? Math.max(-1, Math.min(1, sh.meter / sh.hp)) : 0;
      this.shell.position.copy(sh.center()); this.shell.scale.setScalar(r);
      this.yolk.position.copy(sh.center()); this.yolk.scale.setScalar(Math.min(r * 0.62, 1.05));
      const U = this.shellU;
      U.uM.value += (k - U.uM.value) * Math.min(1, dt * 10);
      U.uFlash.value = sh.flashK || 0; U.uTime.value = t; U.uWarn.value = Math.abs(k) > 0.75 ? 1 : 0;
      U.uGrow.value = sh.state === 'growing' ? 0.45 + 0.55 * (1 - sh.grow / Math.max(0.01, sh.growT)) : 1;
      U.uColA.value.copy(this._col(0)); U.uColB.value.copy(this._col(1));
      this.yolk.material.opacity = 0.12 + 0.06 * Math.sin(t * 3);
    }
    // ---- the resting carp / the reset comet / free
    const resting = !H && Kp.phase !== 'done';
    this.carp.visible = resting;
    this.halo.visible = Kp.phase === 'free';
    if (resting) {
      let p = Kp.pos, y = p.y + K.shell.lift + 0.06 * Math.sin(t * 2.2);
      if (Kp.phase === 'resetting') {
        y = p.y + 0.3;
        this.carp.rotation.set(0, Math.atan2(Kp.R.pond.x - p.x, Kp.R.pond.z - p.z), Math.sin(t * 20) * 0.2);
        if ((this._trailT = (this._trailT || 0) + dt) > 0.03) { this._trailT = 0; G.fx?.burst?.(_v.set(p.x, y, p.z), UP, GOLD, { count: 3, speed: 1.5, size: 0.13 }); }
      } else this.carp.rotation.set(0.12 * Math.sin(t * 1.3), (this.carp.rotation.y + dt * 0.7) % (Math.PI * 2), 0.08 * Math.sin(t * 1.7));
      this.carp.position.set(p.x, y, p.z);
      const m = this.carp.userData.mats;
      if (m) { const free = Kp.phase === 'free'; m[0].emissiveIntensity = free ? 0.55 + 0.25 * Math.sin(t * 6) : 0.25; m[1].emissiveIntensity = free ? 0.9 + 0.4 * Math.sin(t * 6) : 0.35; }
      if (Kp.phase === 'free') {
        this.halo.position.set(p.x, p.y + 0.06, p.z); this.halo.scale.setScalar(1.6 + 0.2 * Math.sin(t * 5)); this.halo.material.opacity = 0.45 + 0.25 * Math.sin(t * 5);
        if ((this._spT = (this._spT || 0) + dt) > 0.12) { this._spT = 0; G.fx?.burst?.(_v.set(p.x + (Math.random() - 0.5) * 0.8, y + (Math.random() - 0.5) * 0.5, p.z + (Math.random() - 0.5) * 0.8), UP, GOLD, { count: 1, speed: 0.8, size: 0.08 }); }
      }
    }
    // ---- held: droplets off the fins; the last 3 s: steam and the red ring for its teammates
    if (H && H.alive && !hid && !(H.form === 'squid' && H.submerged)) {
      if ((this._dripT = (this._dripT || 0) + dt) > 0.22) { this._dripT = 0; G.fx?.drop?.(_v.set(H.pos.x - Math.cos(H.yaw) * 0.25, H.pos.y + 1.25, H.pos.z + Math.sin(H.yaw) * 0.25), _v2.set(0, -1, 0), H.color || this._col(H.team), { size: 0.05 }); }
    }
    const fuse = H ? (H === G.match?.local ? Kp.hud.fuseShown : Kp.fuse) : 99;
    const warn = !!(H && H.alive && fuse <= 3 && !hid);
    this.warnRing.visible = warn;
    if (warn) {
      this.warnRing.position.set(H.pos.x, H.pos.y + 0.08, H.pos.z); this.warnRing.scale.setScalar(K.explodeR); this.warnRing.material.opacity = 0.45 + 0.4 * Math.abs(Math.sin(t * (6 + (3 - fuse) * 4)));
      if ((this._stT = (this._stT || 0) + dt) > 0.08) { this._stT = 0; G.fx?.inkSteam?.(_v.set(H.pos.x, H.pos.y + 1.4, H.pos.z), this._col(1 - H.team), 0.8); }
    }
    // ---- the pillar
    this.pillar.visible = !hid && Kp.phase !== 'done' && !(H && !H.alive);
    if (this.pillar.visible) {
      const px = H ? H.pos.x : Kp.pos.x, py = H ? H.pos.y : Kp.pos.y, pz = H ? H.pos.z : Kp.pos.z;
      this.pillar.position.set(px, py + (H ? 23.2 : 21), pz);
      this.pillarU.uCol.value.copy(H ? this._col(H.team) : GOLD); this.pillarU.uTime.value = t; this.pillarU.uA.value = H ? 0.85 : 1;
    }
    // ---- the wake glow (everyone sees it, depth-tested: only with a line of sight)
    const swim = !!(H && H.alive && (H.submerged || H.climbing));
    this.wake.visible = swim;
    if (swim) {
      this.wakeU.uCol.value.copy(this._col(H.team)); this.wakeU.uTime.value = t; this.wakeU.uA.value = 0.9;
      if (H.climbing && H.wallN) { this.wake.position.copy(H.pos).addScaledVector(H.wallN, 0.06); this.wake.position.y += 0.4; this.wake.lookAt(_v.copy(this.wake.position).add(H.wallN)); }
      else {
        this.wake.position.set(H.pos.x, H.pos.y + 0.05, H.pos.z);
        const vy = Math.hypot(H.vel.x, H.vel.z) > 0.5 ? Math.atan2(H.vel.x, H.vel.z) : H.yaw;
        this.wake.rotation.set(-Math.PI / 2, 0, 0); this.wake.rotation.order = 'YXZ'; this.wake.rotation.y = vy + Math.PI;
      }
    }
    // ---- weirs: curtains (draining once lowered), caps sinking and going grey
    for (const x of this.weirs) {
      x.U.uTime.value = t;
      if (Kp.lowered[x.w.team] && x.low < 0) x.low = 0;
      if (x.low >= 0 && x.low < 1.2) x.low = Math.min(1.2, x.low + dt);
      const k = x.low < 0 ? 0 : x.low;
      x.U.uDrain.value = ease(k / 0.6);
      x.cur.visible = x.U.uDrain.value < 0.999;
      x.lip.visible = x.low < 0;
      const sink = ease(k / 1.2);
      for (const c of x.caps) {
        c.position.y = x.y0 - 0.6 * sink;
        const u = c.userData; u.gold.color.set('#f2c14e').lerp(GREY, sink); u.gold.emissiveIntensity = 0.3 * (1 - sink); u.lamp.visible = sink < 0.98; u.lamp.material.opacity = (0.7 + 0.3 * Math.sin(t * 4)) * (1 - sink);
      }
    }
    // ---- Gates: the arch rises (1.4 s) with its column; the lid slides away
    for (const g of this.gates) {
      if (Kp.gateUp[g.g.team] && g.up < 0) g.up = 0;
      if (g.up >= 0 && g.up < 1.4) g.up = Math.min(1.4, g.up + dt);
      const k = g.up < 0 ? 0 : ease(g.up / 1.4);
      g.arch.visible = k > 0.001; g.arch.scale.set(1, Math.max(0.001, k), 1);
      g.column.visible = k > 0.01; g.U.uA.value = k * (0.85 + 0.15 * Math.sin(t * 3)); g.U.uTime.value = t;
      g.lid.visible = k < 0.99; g.lid.position.y = 0.18 - 0.2 * k; g.seal.visible = k < 0.5;
      g.ring.material.opacity = 0.55 + (k > 0 ? 0.35 * (0.5 + 0.5 * Math.sin(t * 4)) : 0);
      if (k > 0) g.arch.userData.ink.emissiveIntensity = 0.35 + 0.25 * Math.sin(t * 3);
    }
    // ---- zones, the carrierBlock shimmer (brighter for a carrier near), boards
    for (const U of this.zoneU) U.uTime.value = t;
    this.blockU.uTime.value = t; this.blockU.uA.value = G.match?.local?.carry ? 1.6 : 0.6;
    // ---- shock rings, spouts
    for (let i = this.ringFx.length - 1; i >= 0; i--) {
      const r = this.ringFx[i]; r.t += dt;
      const k = r.t / r.life; r.m.scale.setScalar(0.3 + (r.R - 0.3) * ease(Math.min(1, k * 1.3))); r.m.material.opacity = 0.9 * (1 - k);
      if (k >= 1) { this.root.remove(r.m); r.m.material.dispose(); this.ringFx.splice(i, 1); }
    }
    for (let i = this.spouts.length - 1; i >= 0; i--) {
      const s = this.spouts[i]; s.t += dt; s.U.uTime.value = t; const k = s.t / 0.9;
      s.m.scale.set(1 + 0.4 * k, Math.min(1, s.t / 0.15) * (1 + 0.3 * k), 1 + 0.4 * k); s.m.rotation.y += dt * 9; s.U.uA.value = 1 - k;
      if (k >= 1) { this.root.remove(s.m); s.m.material.dispose(); this.spouts.splice(i, 1); }
    }
    // ---- Carp Shots
    const live = new Set();
    for (const s of G.karpGun?.shots || []) {
      live.add(s);
      let e = this.shots.get(s);
      if (!e) {
        const col = s.owner?.color || this._col(s.team);
        e = { ball: new THREE.Mesh(this.shotGeo, new THREE.MeshStandardMaterial({ color: col, roughness: 0.12, metalness: 0.1, emissive: col, emissiveIntensity: 0.25 })),
          ring: noAO(new THREE.Mesh(this.ringGeo, glow(col, 0.85, { side: THREE.DoubleSide }))), disc: noAO(new THREE.Mesh(this.discGeo, basic(col, { opacity: 0.18, side: THREE.DoubleSide }))), col, tT: 0 };
        e.ring.rotation.x = e.disc.rotation.x = -Math.PI / 2;
        this.root.add(e.ball, e.ring, e.disc); this.shots.set(s, e);
      }
      e.ball.visible = s.phase !== 'done';
      e.ball.position.copy(s.pos);
      if (s.phase === 'fly') {
        e.ball.scale.setScalar(1 + 0.5 * s.c);
        if ((e.tT += dt) > 0.025) { e.tT = 0; G.fx?.shotTrail?.(s.pos, s.vel, e.col, s.c >= 0.5); }
      } else if (s.phase === 'swell') {
        const k = Math.min(1, s.swell / K.gun.swell);
        e.ball.scale.set(1 + 1.6 * k + 0.12 * Math.sin(t * 40), 1 + 1.1 * k - 0.1 * Math.sin(t * 40), 1 + 1.6 * k + 0.12 * Math.sin(t * 40 + 1));
      }
      const sw = s.phase === 'swell';
      e.ring.visible = e.disc.visible = sw;
      if (sw) {
        const k = Math.min(1, s.swell / K.gun.swell), R = s.radius * (0.35 + 0.65 * ease(k));
        e.ring.position.set(s.land.x, s.land.y + 0.08, s.land.z); e.ring.scale.setScalar(R); e.ring.material.opacity = 0.6 + 0.35 * Math.sin(t * 30);
        e.disc.position.set(s.land.x, s.land.y + 0.07, s.land.z); e.disc.scale.setScalar(R); e.disc.material.opacity = 0.12 + 0.18 * k;
      }
    }
    for (const [s, e] of this.shots) if (!live.has(s)) { this.root.remove(e.ball, e.ring, e.disc); e.ball.material.dispose(); e.ring.material.dispose(); e.disc.material.dispose(); this.shots.delete(s); }
    // ---- the local carrier's arc preview while charging: dashes flowing to the landing ring
    const me = G.match?.local, g = me && me.carry?.gun;
    const show = !!(me && me === H && g && (g.charging || g.tap) && me.form !== 'squid');
    this.arcRing.visible = this.arcDots.visible = this.arcDisc.visible = show;
    if (show) {
      this._arcT = (this._arcT + dt * 2.2) % 1;
      const L = launch(me, g.c), p = L.from.clone(), v = L.vel.clone(), STEP = 0.025;
      let landed = null, nd = 0, s = 0, next = 0.35 + this._arcT * 0.9;
      for (let i = 0; i < 160 && !landed; i++) {
        const n = _v.copy(p).addScaledVector(v, STEP);
        v.y -= K.gun.gravity * STEP;
        if (!G.physics.los(p, n)) { landed = p.clone(); break; }
        s += n.distanceTo(p); p.copy(n);
        if (s >= next && nd < 28) { this.arcDots.setMatrixAt(nd++, this._m4.makeScale(1, 1, 1).setPosition(p.x, p.y, p.z)); next += 0.9; }
      }
      this.arcDots.count = nd; this.arcDots.instanceMatrix.needsUpdate = true;
      const end = landed || p, R = radiusOf(g.c), col = me.color || this._col(me.team), full = g.c >= 1;
      this.arcRing.position.set(end.x, end.y + 0.07, end.z); this.arcRing.scale.setScalar(R * (full ? 1 + 0.04 * Math.sin(t * 20) : 1));
      this.arcDisc.position.set(end.x, end.y + 0.06, end.z); this.arcDisc.scale.setScalar(R);
      this.arcDots.material.color.copy(col); this.arcRing.material.color.copy(full ? WHITE : col); this.arcDisc.material.color.copy(col);
      this.arcDisc.material.opacity = full ? 0.3 : 0.18;
      this.arcEnd = [end.x, end.y, end.z];
    } else this.arcEnd = null;
  }
}
function emitShake(pos, amount) { emit('shake', { pos: pos.clone(), amount }); }
