// Tower Command: ink on the tower itself. The level's paint (src/world/paint.js) lives on static faces; the tower moves,
// so it keeps its own: its four walls and its deck (inside the grate that rims the top, which never takes ink) each hold
// a grid of which team's ink is where, and one canvas texture the tower's look draws them from (src/fx/towerFx.js).
//   • every splat on the stage (Paint.splat, so online ones too) that reaches the tower paints it, in tower space: the
//     ink rides with it
//   • the deck in your ink is ground you swim, refill and hide in (Actor._surface); its walls in your ink are walls you
//     swim up (Actor._updateClimb) — the platform is higher than a jump, that's the way on
import * as THREE from 'three';
import { G } from '../core/ctx.js';
import { TOWER } from '../config.js';

const CELL = 0.1;                    // m per ownership cell
const PPM = 64;                      // canvas pixels per metre
export const GRATE = 0.3;            // m of grate rimming the deck (no ink)
const _d = new THREE.Vector3();

// a tiny deterministic noise for the splat edges (the same splat looks the same on every screen)
const rnd = (s) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export class TowerPaint {
  constructor(T) {
    this.T = T;
    const R = TOWER.platformR, H = TOWER.platformH, Ri = R - GRATE;
    this.R = R; this.H = H; this.Ri = Ri;
    // surfaces: the deck (a: local x, b: local z over ±Ri) and the walls +x, −x, +z, −z (a: along the wall over ±R,
    // b: height 0…H); rect = where each sits in the canvas
    const dw = Math.ceil(2 * Ri * PPM), ww = Math.ceil(2 * R * PPM), wh = Math.ceil(H * PPM);
    this.surf = [
      { id: 'deck', a0: -Ri, a1: Ri, b0: -Ri, b1: Ri, rect: [0, 0, dw, dw] },
      { id: '+x', a0: -R, a1: R, b0: 0, b1: H, rect: [dw + 2, 0, ww, wh] },
      { id: '-x', a0: -R, a1: R, b0: 0, b1: H, rect: [dw + 2, wh + 2, ww, wh] },
      { id: '+z', a0: -R, a1: R, b0: 0, b1: H, rect: [dw + ww + 4, 0, ww, wh] },
      { id: '-z', a0: -R, a1: R, b0: 0, b1: H, rect: [dw + ww + 4, wh + 2, ww, wh] },
    ];
    for (const s of this.surf) { s.nu = Math.ceil((s.a1 - s.a0) / CELL); s.nv = Math.ceil((s.b1 - s.b0) / CELL); s.grid = new Int8Array(s.nu * s.nv); }
    this.W = dw + 2 * ww + 6; this.Hc = Math.max(dw, 2 * wh + 2);
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.W; this.canvas.height = this.Hc;
    this.ctx = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.dirty = false;
    this.n = 0;
  }
  dispose() { this.texture.dispose(); }

  // world → tower space (x across, y up from the base, z along its heading)
  _local(p, out) {
    const T = this.T, c = Math.cos(T.yaw), s = Math.sin(T.yaw);
    _d.subVectors(p, T.pos);
    return out.set(_d.x * c - _d.z * s, _d.y, _d.x * s + _d.z * c);
  }

  // a splat of ink (Paint.splat forwards every one): paint whichever of the tower's surfaces its sphere reaches
  splat(center, radius, team, opts = {}) {
    if (opts.cosmetic || team < 0 || team > 1) return;
    const T = this.T, R = this.R, H = this.H, pad = radius + 0.2;
    // quick reject against the tower's box
    if (Math.abs(center.x - T.pos.x) > R * 1.5 + pad || Math.abs(center.z - T.pos.z) > R * 1.5 + pad || center.y < T.pos.y - pad || center.y > T.pos.y + H + pad) return;
    const L = this._local(center, _l);
    const r = radius * 1.1, seed = opts.seed ?? Math.random();
    const hit = (s, dn, a, b) => {
      if (dn > r || dn < -0.12) return;
      const rr = Math.sqrt(Math.max(0, r * r - Math.max(0, dn) * Math.max(0, dn)));
      if (rr > 0.02) this._paint(s, a, b, rr, team, seed);
    };
    hit(this.surf[0], L.y - H, L.x, L.z);
    if (L.y > -0.2 && L.y < H + 0.2) {
      hit(this.surf[1], L.x - R, L.z, L.y);
      hit(this.surf[2], -R - L.x, -L.z, L.y);
      hit(this.surf[3], L.z - R, -L.x, L.y);
      hit(this.surf[4], -R - L.z, L.x, L.y);
    }
  }
  _paint(s, a, b, rr, team, seed) {
    if (a + rr < s.a0 || a - rr > s.a1 || b + rr < s.b0 || b - rr > s.b1) return;
    // ownership: the cells the blob covers
    const i0 = Math.max(0, Math.floor((a - rr - s.a0) / CELL)), i1 = Math.min(s.nu - 1, Math.floor((a + rr - s.a0) / CELL));
    const j0 = Math.max(0, Math.floor((b - rr - s.b0) / CELL)), j1 = Math.min(s.nv - 1, Math.floor((b + rr - s.b0) / CELL));
    const t = team + 1;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const ca = s.a0 + (i + 0.5) * CELL, cb = s.b0 + (j + 0.5) * CELL;
      if ((ca - a) * (ca - a) + (cb - b) * (cb - b) <= rr * rr) s.grid[j * s.nu + i] = t;
    }
    // the look: a blob with a few drops round it, in the team's ink
    const g = this.ctx, [rx, ry, rw, rh] = s.rect, sx = rw / (s.a1 - s.a0), sy = rh / (s.b1 - s.b0);
    const px = (u) => rx + (u - s.a0) * sx, py = (v) => ry + rh - (v - s.b0) * sy;
    g.save();
    g.beginPath(); g.rect(rx, ry, rw, rh); g.clip();
    g.fillStyle = (G.teamHex && G.teamHex[team]) || (team ? '#2f5bff' : '#ff8a14');
    g.beginPath();
    const n = 9;
    for (let k = 0; k <= n; k++) {
      const ang = (k / n) * Math.PI * 2, w = 0.82 + 0.3 * rnd(seed * 91 + k);
      const x = px(a + Math.cos(ang) * rr * w), y = py(b + Math.sin(ang) * rr * w);
      if (k === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.closePath(); g.fill();
    for (let k = 0; k < 3; k++) {
      const ang = rnd(seed * 17 + k * 3.1) * Math.PI * 2, d = rr * (1.1 + 0.5 * rnd(seed * 5 + k)), dr = rr * (0.12 + 0.12 * rnd(seed * 3 + k));
      g.beginPath(); g.arc(px(a + Math.cos(ang) * d), py(b + Math.sin(ang) * d), dr * sx, 0, Math.PI * 2); g.fill();
    }
    g.restore();
    this.dirty = true;
    this.n++;
  }

  // team at a surface point: 0 none, 1 = team 0, 2 = team 1
  _at(s, a, b) {
    const i = Math.floor((a - s.a0) / CELL), j = Math.floor((b - s.b0) / CELL);
    if (i < 0 || j < 0 || i >= s.nu || j >= s.nv) return 0;
    return s.grid[j * s.nu + i];
  }
  // the ink under feet standing on the deck (the grate rim: none)
  groundTeam(p) {
    const L = this._local(p, _l);
    return this._at(this.surf[0], L.x, L.z);
  }
  // the ink on a wall at a world point with the wall's outward normal (from a raycast)
  wallTeam(p, n) {
    const L = this._local(p, _l), T = this.T, c = Math.cos(T.yaw), s = Math.sin(T.yaw);
    const nx = n.x * c - n.z * s, nz = n.x * s + n.z * c;
    if (Math.abs(nx) >= Math.abs(nz)) return nx > 0 ? this._at(this.surf[1], L.z, L.y) : this._at(this.surf[2], -L.z, L.y);
    return nz > 0 ? this._at(this.surf[3], -L.x, L.y) : this._at(this.surf[4], L.x, L.y);
  }
  // where a surface sits in the canvas, as UVs (for the look)
  uv(i) { const [x, y, w, h] = this.surf[i].rect; return [x / this.W, 1 - (y + h) / this.Hc, (x + w) / this.W, 1 - y / this.Hc]; }
}
const _l = new THREE.Vector3();
