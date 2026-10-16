// [b5-karp-checker] The Bazookarp kit's looks that a level block can't carry (SPEC §4.1, §4.2, §6.7), kept apart from
// bazookarpFx (WP2 rebuilds that one wholesale):
//   NO CARP boards   both faces of every sign board (level blocks tagged 'karp-sign-board', bazookarp-kit.js): a
//                    crossed-out carp over "NO CARP" in the owning team's ink on the board's cream face
//   carrierBlock     a faint shimmer on each volume's walls (diagonal bands drifting upward, brightest at the floor) with
//                    the NO CARP glyph on each wall: everyone sees where a carrier can't go (others pass)
// Built on 'match:state' for a Bazookarp match, cleared otherwise; the shimmer animates from G.time in onBeforeRender, so
// nothing needs a per-frame call. Purely visual: nothing here collides.
import * as THREE from 'three';
import { G, on } from '../core/ctx.js';

const _c = new THREE.Color();
// the crossed-out carp: a side-on fish (body, forked tail, fin, eye) under a red ring and bar, "NO CARP" below
export function drawNoCarp(g, w, h, ink, opts = {}) {
  const bg = 'bg' in opts ? opts.bg : '#efe9dc';   // (bg: null = transparent: `??` turned the shimmer's null into the board's cream)
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  if (opts.frame !== false) { g.strokeStyle = '#3b3631'; g.lineWidth = h * 0.05; g.strokeRect(h * 0.03, h * 0.03, w - h * 0.06, h - h * 0.06); }
  const cx = w / 2, cy = h * (opts.text === false ? 0.5 : 0.4), R = h * (opts.text === false ? 0.42 : 0.3);
  g.save(); g.translate(cx, cy);
  g.fillStyle = ink;
  g.beginPath(); g.ellipse(-R * 0.08, 0, R * 0.62, R * 0.34, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(R * 0.46, 0); g.lineTo(R * 0.86, -R * 0.32); g.lineTo(R * 0.74, 0); g.lineTo(R * 0.86, R * 0.32); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(-R * 0.25, -R * 0.3); g.quadraticCurveTo(R * 0.02, -R * 0.62, R * 0.2, -R * 0.28); g.closePath(); g.fill();
  g.fillStyle = bg || '#fff'; g.beginPath(); g.arc(-R * 0.48, -R * 0.06, R * 0.07, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#d6332b'; g.lineWidth = R * 0.16;
  g.beginPath(); g.arc(0, 0, R * 0.92, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(-R * 0.65, -R * 0.65); g.lineTo(R * 0.65, R * 0.65); g.stroke();
  g.restore();
  if (opts.text !== false) { g.fillStyle = '#2d2925'; g.font = `900 ${Math.round(h * 0.2)}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('NO CARP', cx, h * 0.84); }
}
function boardTexture(ink) {
  const c = document.createElement('canvas'); c.width = 384; c.height = 256;
  drawNoCarp(c.getContext('2d'), 384, 256, ink);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function glyphTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  drawNoCarp(c.getContext('2d'), 256, 256, '#4a3d6b', { bg: null, frame: false, text: false });   // (a dark carp: it reads on pale floor and sky)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const SHIMMER_VS = `varying vec2 vUv; varying float vH; void main() { vUv = uv; vH = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SHIMMER_FS = `uniform float uT; uniform vec3 uCol; uniform float uLen; varying vec2 vUv; varying float vH;
void main() {
  float band = 0.5 + 0.5 * sin((vUv.x * uLen * 2.2 + vUv.y * 5.0 - uT * 2.4));
  float fade = smoothstep(1.0, 0.0, vH) * 0.85 + 0.15;
  float edge = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x);
  float a = (0.10 + 0.22 * pow(band, 6.0)) * fade * edge;
  gl_FragColor = vec4(uCol, a);
}`;

export class KarpKitFx {
  constructor(scene) {
    this.scene = scene; this.root = null; this.match = null;
    this._unsubs = [on('match:state', ({ state, match }) => {
      if (!match || match.attract || !match.karp || state === 'results') { if (!match || match !== this.match || state === 'results') this.clear(); return; }
      if (match !== this.match) this.build(match);
    })];
    G.karpKitFx = this;
  }
  clear() {
    if (this.root) { this.scene.remove(this.root); this.root.traverse((o) => { o.geometry?.dispose?.(); if (o.material) { o.material.map?.dispose?.(); o.material.dispose(); } }); }
    this.root = null; this.match = null;
  }
  dispose() { this.clear(); this._unsubs.forEach((u) => u()); }
  build(match) {
    this.clear();
    const Kp = match.karp, L = G.level;
    if (!Kp || !L) return;
    this.match = match;
    const root = (this.root = new THREE.Group()); root.name = 'karpKitFx';
    const ink = (t) => '#' + _c.set(G.teamColors?.[t] || (t ? '#2f5bff' : '#ff8a14')).getHexString();
    // the NO CARP boards: whose sign is it (the nearest data sign of the field's list), a decal on both faces
    const tex = [boardTexture(ink(0)), boardTexture(ink(1))];
    const signs = Kp.field?.signs || [];
    for (const b of L.blocks) {
      if (b.tag !== 'karp-sign-board') continue;
      let team = b.center.z > 0 ? 1 : 0, bd = Infinity;
      for (const s of signs) { const d = Math.hypot(s.x - b.center.x, s.z - b.center.z); if (d < bd) { bd = d; team = s.team; } }
      const n = b.axes[2];
      for (const side of [1, -1]) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(b.half.x * 2 * 0.94, b.half.y * 2 * 0.9), new THREE.MeshBasicMaterial({ map: tex[team], toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 }));
        m.position.copy(b.center).addScaledVector(n, side * (b.half.z + 0.004));
        m.lookAt(m.position.clone().addScaledVector(n, side));
        root.add(m);
      }
    }
    // the carrierBlock shimmer: a wall per polygon edge from the volume's floor up 2.4 m, the glyph mid-wall facing out
    const glyph = glyphTexture();
    for (const v of Kp.R?.carrierBlock || []) {
      const poly = v.poly, y0 = (v.y0 ?? 0) + 0.02, hgt = Math.max(2.4, (v.y1 ?? 0) - (v.y0 ?? 0) + 2.2);
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (len < 0.2) continue;
        const fy = Math.max(y0, L.groundHeight((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (v.y1 ?? 2) + 0.5) + 0.02);
        const mat = new THREE.ShaderMaterial({ vertexShader: SHIMMER_VS, fragmentShader: SHIMMER_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uT: { value: 0 }, uCol: { value: new THREE.Color('#e9dcff') }, uLen: { value: len } } });
        const wall = new THREE.Mesh(new THREE.PlaneGeometry(len, hgt), mat);
        wall.position.set((a[0] + b[0]) / 2, fy + hgt / 2, (a[1] + b[1]) / 2);
        wall.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
        wall.renderOrder = 3;
        wall.onBeforeRender = () => { mat.uniforms.uT.value = G.time || 0; };
        root.add(wall);
        if (len >= 1.6) {
          const gm = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: glyph, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
          gm.position.set(wall.position.x, fy + 1.3, wall.position.z); gm.rotation.y = wall.rotation.y; gm.renderOrder = 4;
          root.add(gm);
        }
      }
    }
    this.scene.add(root);
  }
}
