// Highmark Foundry's lava — the Bellows' breath: the stage module for LAYOUT.lava (the contract:
// tools/botlab/jobs/batch5/stages/caldera/ENGINE.md; the design: DESIGN.md §3–4; the registry: docs/STAGE-MODS.md).
//
// The lava is a set piece like the movers and the pods: its level is a pure function of the shared stage clock (the
// host's match clock every follower tracks), so nothing goes over the wire in a match beyond the painter's stage time
// on splats near it. The lake under it is VOID (no bed): every "no floor here" check in the engine already treats it as
// deadly. One horizontal surface over the region (LAYOUT.lava.region, drawn 0.5 m inside every bank) moves between LOW
// and HIGH on the mode's timetable, with a warning before every move:
//   • feet below L + 0.15 inside the region splat you (cause 'lava', the sea's rule: R.kill), a fall into a `falls`
//     polygon past a Spillway lip says 'lava' too (R.fallCause)
//   • the floors it covers are gone: once the surface is 0.05 m over a flat floor its collider is off (b.solid = false,
//     b.absent: groundHeight, shots, devices, shoves, bots and the audits see no floor — nobody can stand there anyway,
//     the kill height is 0.2 m lower) and back when it falls away; nothing inks under the surface (paint.setClip) and
//     ink is burned off as the surface climbs over it (paint.clearCells + an atlas band); cells always under LOW are
//     never turf (paint.retireCells)
//   • riders: the Pumice Race's sink stones (bare pumice, top = L + 0.45 while up, solid exactly while the shelf beside
//     them is deadly) and the Organ Pipes (hexagonal basalt floats whose tops are linear in L) — dynamic level blocks
//     (Level.addDynamic / moveDynamic) placed at the first playing frame; their tops carry anyone on them (the actor's
//     ground stick)
//   • devices it reaches are destroyed (the owner's 4 Hz sweep: the module-private walk of G.subs.items until the subs
//     package's G.deploy.crushIn lands — then S.crushIn({ where }, 'lava')); no device is placed under rising lava
//     (R.noPlace → G.level.noPlace); shots, bombs and thrown subs that reach it fizzle (R.under + R.fizzle: S.sink)
//   • bots: the nav graph is built at both rider poses and merged (W.buildNav, with the layout's explicit `steps` links
//     over every rider seam); A* checks each node's time window at the bot's arrival time (R.navEdge / R.navNode);
//     goals skip floor the lava reaches within 8 s; a bot on drowning floor (or a sinking stone) walks the precomputed
//     way out (R.botAct); `R.wet` makes every edge / water guard refuse drowning floor
//   • the HUD gauge chip, callouts, the personal line, the minimap layer, the Surge Gauge needles and beacons, bell /
//     siren / whistle (src/audio/sfx-lava.js), embers rising vs steam falling (src/fx/lavaFx.js)
import * as THREE from 'three';
import { G, emit, on } from '../core/ctx.js';
import { PLAYER } from '../config.js';
import { registerStageMod, registerCause } from './stageMods.js';
import { NavGraph } from './nav.js';
import { inMode } from '../world/variants.js';
import { BoxPaint } from './towerPaint.js';
import { LAVA, lavaSchedule, lavaAt, lavaY, lavaMax, crossTime, stoneRel, riderTop, expandLava, partPose, inRider, pointInPoly } from './lavaCore.js';
import { LavaLook, LavaHud, lavaLevelExt, patchStain, LAVA_ICON, drawLavaMap } from '../fx/lavaFx.js';
import '../audio/sfx-lava.js';

export { LAVA, lavaSchedule, lavaAt, lavaMax, riderTop };
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _c = new THREE.Vector3(), _h = new THREE.Vector3(), _pp = {};
const UP = new THREE.Vector3(0, 1, 0);
const RES = 0.25;   // m per texel of the region mask

registerCause('lava', { name: 'Burned in the lava', knocked: 'Knocked into the lava', icon: LAVA_ICON, flood: '#a3121a', clear: true, byColor: '#ff5a2a' });

// the audit switch: ?lava=low|high|rise|fall holds the lava there (PAGEQ='lava=high' on the botlab harnesses)
function heldFromQuery() {
  let v = null;
  try { if (typeof location !== 'undefined' && location.search) v = new URLSearchParams(location.search).get('lava'); } catch (e) { /* no page */ }
  return v === 'low' || v === 'high' || v === 'rise' || v === 'fall' ? v : null;
}

// a BoxPaint that only takes ink on the listed faces ('deck', '+x', '-x', '+z', '-z')
class MaskPaint extends BoxPaint {
  constructor(frame, o, faces) { super(frame, o); this.mask = this.surf.map((s) => faces.includes(s.id)); }
  _paint(s, a, b, rr, team, seed) { if (this.mask[this.surf.indexOf(s)]) super._paint(s, a, b, rr, team, seed); }
}

// ================================================================================================== the world
export class LavaWorld {
  constructor(ctx) {
    const def = (this.def = ctx.data);
    this.mode = ctx.mode;
    this.low = def.low; this.high = def.high;
    const X = expandLava(def, (it) => inMode(it, ctx.mode));
    Object.assign(this, X);   // polys, falls, riders, steps, gauges, cascades, vents
    this.nParts = this.riders.reduce((s, r) => s + r.parts.length, 0);
    if (this.nParts > LAVA.maxParts) console.warn(`[lava] ${this.nParts} rider parts (cap ${LAVA.maxParts})`);
    this._buildMask();
    this.uniforms = {
      uLavaMap: { value: this.map }, uLavaBox: { value: new THREE.Vector4(this.box.x0, this.box.z0, 1 / (this.box.nx * RES), 1 / (this.box.nz * RES)) },
      uLavaS: { value: new THREE.Vector4(this.low, this.high, this.low, 0) },    // L, HIGH, LOW, time
      uLavaW: { value: new THREE.Vector4(0, 0, 0, 0) },                          // warn pulse (+rise / −fall), moving (−1 … 1), agitation, rest
    };
    this.y = this.low;
    this.nav = null; this.navProblems = [];
    this.look = null; this.level = null; this.paint = null;
  }

  // ------------------------------------------------------------------------- the region: a mask raster (scanline fill)
  _buildMask() {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const P of this.polys) for (const [x, z] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    x0 = Math.floor(x0 - 2); z0 = Math.floor(z0 - 2); x1 = Math.ceil(x1 + 2); z1 = Math.ceil(z1 + 2);
    const nx = Math.round((x1 - x0) / RES), nz = Math.round((z1 - z0) / RES), mask = new Uint8Array(nx * nz);
    for (const P of this.polys) {
      for (let j = 0; j < nz; j++) {
        const z = z0 + (j + 0.5) * RES, xs = [];
        for (let i = 0, k = P.length - 1; i < P.length; k = i++) {
          const [xa, za] = P[i], [xb, zb] = P[k];
          if ((za > z) !== (zb > z)) xs.push(xa + ((z - za) * (xb - xa)) / (zb - za));
        }
        xs.sort((a, b) => a - b);
        for (let q = 0; q + 1 < xs.length; q += 2) {
          const i0 = Math.max(0, Math.ceil((xs[q] - x0) / RES - 0.5)), i1 = Math.min(nx - 1, Math.floor((xs[q + 1] - x0) / RES - 0.5));
          for (let i = i0; i <= i1; i++) mask[j * nx + i] = 1;
        }
      }
    }
    this.box = { x0, z0, nx, nz, res: RES };
    this.mask = mask;
    const data = new Uint8Array(nx * nz * 4);
    for (let k = 0; k < nx * nz; k++) data[k * 4] = mask[k] * 255;
    this.map = new THREE.DataTexture(data, nx, nz, THREE.RGBAFormat);
    this.map.magFilter = THREE.LinearFilter; this.map.minFilter = THREE.LinearFilter; this.map.needsUpdate = true;
  }
  inRegion(x, z) {
    const B = this.box, i = Math.floor((x - B.x0) / RES), j = Math.floor((z - B.z0) / RES);
    return i >= 0 && j >= 0 && i < B.nx && j < B.nz && this.mask[j * B.nx + i] === 1;
  }
  fallsIn(x, z) { for (const P of this.falls) if (pointInPoly(P, x, z)) return true; return false; }

  // ------------------------------------------------------------------------- the level: the floors the lava drowns
  attachLevel(level) {
    this.level = level;
    // every flat, drawn static floor whose whole top lies in the region below HIGH − gone: its collider goes off while
    // the surface is `gone` over it (R._floors)
    this.drown = [];
    for (const b of level.blocks) {
      if (b.dynamic || b.axes[1].y < 0.999 || b.grate || b.rail) continue;
      const top = b.center.y + b.half.y;
      if (top >= this.high - LAVA.gone || top < this.low) continue;
      const ex = Math.abs(b.axes[0].x) * b.half.x + Math.abs(b.axes[2].x) * b.half.z, ez = Math.abs(b.axes[0].z) * b.half.x + Math.abs(b.axes[2].z) * b.half.z;
      let all = true;
      for (const [sx, sz] of [[0, 0], [-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        // the top's own corners (an obox's), pulled in 5 cm
        const x = b.center.x + (b.axes[0].x * (b.half.x - 0.05) * sx + b.axes[2].x * (b.half.z - 0.05) * sz);
        const z = b.center.z + (b.axes[0].z * (b.half.x - 0.05) * sx + b.axes[2].z * (b.half.z - 0.05) * sz);
        if (!this.inRegion(x, z)) { all = false; break; }
      }
      void ex; void ez;
      if (all) { this.drown.push({ b, top }); b.lavaDrown = true; }
    }
  }

  // ------------------------------------------------------------------------- paint: the lava faces, the clip, the burn
  attachPaint(paint) {
    this.paint = paint;
    const retire = [], cells = [];
    const p = new THREE.Vector3();
    let nLava = 0;
    for (const f of paint.paintFaces) {
      // a lava face: any of its cell centres inside the region and below HIGH + 0.05
      let lava = false;
      for (let j = 0; j < f.nv; j++) for (let i = 0; i < f.nu; i++) {
        p.copy(f.origin).addScaledVector(f.u, (i + 0.5) * f.cu).addScaledVector(f.v, (j + 0.5) * f.cv);
        if (p.y > this.high + 0.05 || !this.inRegion(p.x, p.z)) continue;
        lava = true;
        const k = f.grid + j * f.nu + i;
        if (p.y < this.low - 0.02) retire.push(k); else cells.push([k, p.y]);
      }
      f.lava = lava ? 1 : 0;
      if (lava) nLava++;
    }
    if (retire.length) paint.retireCells(retire);
    cells.sort((a, b) => a[1] - b[1]);
    this.cells = { ids: Uint32Array.from(cells.map((c) => c[0])), y: Float32Array.from(cells.map((c) => c[1])) };
    this.retired = retire.length; this.lavaFaces = nLava;
    paint.setClip({ map: this.map, box: this.uniforms.uLavaBox.value, faceOn: (f) => !!f.lava, inside: (x, z) => this.inRegion(x, z),
      clipAt: (et) => { const R = G.match?.lava; return R && R.W === this ? R.inkClip(et) : -1e9; } });
    this._burnMesh = null;
  }
  // the burn's atlas pass: one quad per lava face over its atlas rect, carrying world positions; the shader writes bare
  // texels inside the region below uY (NoBlending)
  burnAtlas(y) {
    const P = this.paint;
    if (!P) return;
    if (!this._burnMesh) {
      const pos = [], w = [], index = [], S = P.size;
      for (const f of P.paintFaces) {
        const a = f.atlas;
        if (!a || !f.lava) continue;
        const padM = (a.pad - 0.5) / a.ppm, base = pos.length / 3;
        for (const [u, v] of [[-padM, -padM], [f.su + padM, -padM], [f.su + padM, f.sv + padM], [-padM, f.sv + padM]]) {
          pos.push(((a.x + a.pad + u * a.ppm) / S) * 2 - 1, ((a.y + a.pad + v * a.ppm) / S) * 2 - 1, 0);
          w.push(f.origin.x + f.u.x * u + f.v.x * v, f.origin.y + f.u.y * u + f.v.y * v, f.origin.z + f.u.z * u + f.v.z * v);
        }
        index.push(base, base + 1, base + 2, base, base + 2, base + 3);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('aW', new THREE.Float32BufferAttribute(w, 3));
      geo.setIndex(index);
      const mat = new THREE.ShaderMaterial({
        uniforms: { uY: { value: 0 }, uMap: this.uniforms.uLavaMap, uBox: this.uniforms.uLavaBox },
        vertexShader: 'attribute vec3 aW; varying vec3 vW; void main() { vW = aW; gl_Position = vec4(position.xy, 0.0, 1.0); }',
        fragmentShader: 'precision highp float; uniform float uY; uniform sampler2D uMap; uniform vec4 uBox; varying vec3 vW; void main() { if (vW.y >= uY || texture2D(uMap, (vW.xz - uBox.xy) * uBox.zw).r < 0.5) discard; gl_FragColor = vec4(0.0); }',
        depthTest: false, depthWrite: false, toneMapped: false, blending: THREE.NoBlending,
      });
      const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false;
      this._burnMesh = mesh; this._burnScene = new THREE.Scene(); this._burnScene.add(mesh);
    }
    this._burnMesh.material.uniforms.uY.value = y;
    P.drawInto(this._burnScene);
  }

  // ------------------------------------------------------------------------- looks
  levelMaterial({ grate }) { return lavaLevelExt(this, grate); }
  afterMeshes(o) {
    this.scene = o.scene;
    this.look = new LavaLook(this, o);
    if (o.props?.mat) for (const k of ['paint', 'gloss', 'metal', 'wood', 'rubber']) if (o.props.mat[k]) patchStain(o.props.mat[k], this.uniforms);
  }
  // (the minimap's base raster keeps the drowned floors whenever it is rebuilt — a side flip at HIGH — the lava layer
  // covers them while they are under)
  attachMinimap(mm) { this.minimap = mm; const prev = mm.blockOk; mm.blockOk = (b) => (prev ? prev(b) : b.solid) || !!b.lavaDrown; }
  ready() { this.setY(this.low, null); }
  // push the height into the uniforms and the look (the menu backdrop, a match, the audits)
  setY(y, st) { this.y = y; this.uniforms.uLavaS.value.x = y; this.look?.setY(y, st); }

  // ------------------------------------------------------------------------- the riders' colliders
  // add every rider's parts as dynamic blocks at `topOf(r)` (null: left out); returns [[block, rider, part]…]
  _addParts(level, topOf) {
    const out = [];
    this.riders.forEach((r, ri) => {
      const top = topOf(r);
      if (top == null) return;
      for (const p of r.parts) {
        const b = level.addDynamic({ tag: 'lava:' + r.id + ':' + out.length, perch: r.kind === 'stone' && p.body, roof: !p.body && p.roof !== false });
        const q = partPose(r, p, top, _pp);
        level.moveDynamic(b, _v.set(q.cx, q.cy, q.cz), _v2.set(q.hx, q.hy, q.hz), q.yaw);
        b.lavaRider = ri;
        out.push([b, r, p]);
      }
    });
    return out;
  }
  // which rider's body top is under (x, z) at height y (±0.12), or −1
  _riderAt(x, z, y, tops) {
    for (let i = 0; i < this.riders.length; i++) {
      const r = this.riders[i], t = tops[i];
      if (t == null || Math.abs(y - t) > 0.12) continue;
      if (inRider(r, x, z, 0.02)) return i;
    }
    return -1;
  }

  // ------------------------------------------------------------------------- the nav graph: two poses merged (§4.3)
  buildNav(level, physics) {
    const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const R = this.riders, H = this.high;
    // LOW pose: the floats at their LOW tops; the sink stones are not there
    const lowTop = R.map((r) => (r.sink ? null : r.top0));
    const highTop = R.map((r) => (r.sink ? H + r.sink.rel[1] : r.top1));
    level.clearDynamic();
    this._addParts(level, (r) => lowTop[R.indexOf(r)]);
    const nav = new NavGraph(level, physics);
    const meta = { rider: [], pose: [], top: [] };
    for (const n of nav.nodes) { const i = this._riderAt(n.x, n.z, n.y, lowTop); meta.rider[n.id] = i; meta.pose[n.id] = i >= 0 ? 0 : -1; meta.top[n.id] = i >= 0 ? lowTop[i] : 0; }
    this.navProblems = [];
    this._cutGaps(nav, level, meta, (n) => this.inRegion(n.x, n.z));
    this._link(nav, meta, 0, lowTop);
    level.clearDynamic();
    // HIGH pose: every rider at its HIGH top (a sink stone surfaced: L + rel[1])
    this._addParts(level, (r) => highTop[R.indexOf(r)]);
    const fresh = [];
    R.forEach((r, ri) => {
      const top = highTop[ri], mine = [];
      let xa = Infinity, xb = -Infinity, za = Infinity, zb = -Infinity;
      for (const p of r.parts) { if (!p.body) continue; const q = partPose(r, p, top, _pp), e = Math.hypot(q.hx, q.hz); xa = Math.min(xa, q.cx - e); xb = Math.max(xb, q.cx + e); za = Math.min(za, q.cz - e); zb = Math.max(zb, q.cz + e); }
      const ix0 = Math.max(0, Math.floor((xa - nav.x0) / nav.step)), ix1 = Math.min(nav.nx - 1, Math.ceil((xb - nav.x0) / nav.step));
      const iz0 = Math.max(0, Math.floor((za - nav.z0) / nav.step)), iz1 = Math.min(nav.nz - 1, Math.ceil((zb - nav.z0) / nav.step));
      const tryAt = (x, z, ix, iz) => {
        if (!inRider(r, x, z, -0.12) || level.groundHeight(x, z, top + 0.05) < top - 0.05 || !nav._clear(x, top, z)) return null;
        const n = nav._addNode(x, top, z, ix, iz);
        nav.cells[iz * nav.nx + ix].push(n.id);
        meta.rider[n.id] = ri; meta.pose[n.id] = 1; meta.top[n.id] = top;
        n.wet = 0; n.overWater = false;
        mine.push(n); fresh.push(n);
        return n;
      };
      for (let iz = iz0; iz <= iz1; iz++) for (let ix = ix0; ix <= ix1; ix++) tryAt(nav.x0 + ix * nav.step, nav.z0 + iz * nav.step, ix, iz);
      // a footprint the 1 m lattice misses: a node at its centre (and the grid cell it falls in)
      if (!mine.length) {
        const ix = Math.round((r.x - nav.x0) / nav.step), iz = Math.round((r.z - nav.z0) / nav.step);
        for (const [ox, oz] of [[0, 0], [0.35, 0], [-0.35, 0], [0, 0.35], [0, -0.35]]) if (tryAt(r.x + ox, r.z + oz, ix, iz)) break;
      }
      // the rider's own walk edges (8 neighbours on its top)
      for (const n of mine) for (const m of mine) {
        if (m === n) continue;
        const d = Math.hypot(m.x - n.x, m.z - n.z);
        if (d > 1.5 || nav._blocked(n, m, top)) continue;
        n.nb.push({ to: m.id, cost: d, type: 'walk' });
      }
    });
    this._cutGaps(nav, level, meta, (n) => meta.pose[n.id] === 1);
    this._link(nav, meta, 1, highTop);
    level.clearDynamic();
    nav._prune();
    // kinds, windows, the way out of every node the lava reaches
    const N = nav.nodes.length;
    const kind = new Uint8Array(N), rider = new Int16Array(N), pose = new Int8Array(N), ptop = new Float32Array(N), shutY = new Float32Array(N);
    for (const n of nav.nodes) {
      const ri = meta.rider[n.id] ?? -1;
      rider[n.id] = ri; pose[n.id] = meta.pose[n.id] ?? -1; ptop[n.id] = meta.top[n.id] || 0;
      if (ri >= 0) { kind[n.id] = 2; n.wet = 0; }
      else if (this.inRegion(n.x, n.z) && n.y - LAVA.navLead < H) { kind[n.id] = 1; shutY[n.id] = n.y - LAVA.navLead; }
    }
    for (const id of this._linkEnds || []) if (nav.nodes[id]) nav.nodes[id].wet = 0;
    const { exit, escD } = this._exits(nav, kind);
    const reach = new Uint8Array(N); for (let i = 0; i < N; i++) reach[i] = kind[i] ? 1 : 0;
    this.nav = nav;
    this.navMeta = { kind, rider, pose, top: ptop, shutY, exit, escD, reach, lowTop, highTop, ms: Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0) };
    nav.lavaMeta = this.navMeta;
    return nav;
  }
  // remove every edge that crosses more than seamMax of nothing (no floor within 0.5 m below the walk) inside the region
  _cutGaps(nav, level, meta, which) {
    let cut = 0;
    for (const n of nav.nodes) {
      if (!which(n)) continue;
      n.nb = n.nb.filter((e) => {
        if (e.type === 'climb' || e.type === 'special' || e.type === 'pipe') return true;
        const m = nav.nodes[e.to], d = Math.hypot(m.x - n.x, m.z - n.z);
        if (d < 0.05) return true;
        const yTop = Math.max(n.y, m.y) + 0.4, yLow = Math.min(n.y, m.y) - 0.5, step = 0.05, k = Math.ceil(d / step);   // (a kerb or a rim within a step-up is floor)
        // (a coarse pass first: any gap wider than seamMax holds a 0.25 m sample; most edges cross plain floor)
        let open = false;
        for (let i = 1, kc = Math.ceil(d / 0.25); i < kc && !open; i++) if (level.groundHeight(n.x + ((m.x - n.x) * i) / kc, n.z + ((m.z - n.z) * i) / kc, yTop) < yLow) open = true;
        if (!open) return true;
        let run = 0, worst = 0;
        for (let i = 1; i < k; i++) {
          const x = n.x + ((m.x - n.x) * i) / k, z = n.z + ((m.z - n.z) * i) / k;
          if (level.groundHeight(x, z, yTop) < yLow) { run += d / k; worst = Math.max(worst, run); } else run = 0;
        }
        if (worst > LAVA.seamMax) { cut++; return false; }
        return true;
      });
    }
    this.gapCuts = (this.gapCuts || 0) + cut;
  }
  // the explicit step links at a pose (0 LOW, 1 HIGH): the closest pair of nodes across each listed seam, both ways
  _link(nav, meta, pose, tops) {
    const nodesOf = (end) => {
      if (end.pt) return nav.nodes.filter((n) => (meta.rider[n.id] ?? -1) < 0 && Math.hypot(n.x - end.pt[0], n.z - end.pt[1]) <= 1.6);
      if (end.rider < 0 || tops[end.rider] == null) return null;
      return nav.nodes.filter((n) => meta.rider[n.id] === end.rider && meta.pose[n.id] === pose);
    };
    this._linkEnds ||= [];
    this.links = this.links || [];
    for (const s of this.steps) {
      const A = nodesOf(s.a), B = nodesOf(s.b);
      if (A === null || B === null) continue;   // (a stone at LOW: not in play)
      const pairs = [];
      for (const a of A) for (const b of B) {
        const d = Math.hypot(a.x - b.x, a.z - b.z), dy = b.y - a.y;
        if (d > 2.6 || Math.abs(dy) > 1.25) continue;
        pairs.push([d + Math.abs(dy) * 0.1, a, b]);
      }
      pairs.sort((p, q) => p[0] - q[0]);
      const used = [];
      for (const [, a, b] of pairs) {
        if (used.length >= 2) break;
        if (used.some(([ua, ub]) => Math.hypot(ua.x - a.x, ua.z - a.z) < 0.8 || Math.hypot(ub.x - b.x, ub.z - b.z) < 0.8)) continue;
        const lo = a.y <= b.y ? a : b, hi = lo === a ? b : a;
        if (nav._blocked(lo, hi, hi.y)) continue;
        // (no edge across more than a seam of nothing)
        const d = Math.hypot(a.x - b.x, a.z - b.z), k = Math.ceil(d / 0.05);
        let run = 0, worst = 0;
        for (let i = 1; i < k; i++) { const x = a.x + ((b.x - a.x) * i) / k, z = a.z + ((b.z - a.z) * i) / k; if (this.level.groundHeight(x, z, hi.y + 0.4) < lo.y - 0.5) { run += d / k; worst = Math.max(worst, run); } else run = 0; }
        if (worst > LAVA.seamMax) continue;
        const add = (u, v) => {
          const dy = v.y - u.y, type = Math.abs(dy) <= 0.5 ? 'walk' : dy > 0 ? 'jump' : 'drop';
          const cost = d + (type === 'jump' ? 2.5 : type === 'drop' ? 0.8 : 0);
          const old = u.nb.find((e) => e.to === v.id);
          if (old) { old.link = true; return; }
          u.nb.push({ to: v.id, cost, type, link: true });
        };
        add(a, b); add(b, a);
        used.push([a, b]);
        this._linkEnds.push(a.id, b.id);
      }
      this.links.push({ pose, a: s.a.id || s.a.pt, b: s.b.id || s.b.pt, pairs: used.length, twin: s.twin });
      if (!used.length) { this.navProblems.push({ pose, a: s.a.id || s.a.pt, b: s.b.id || s.b.pt, A: A.length, B: B.length }); console.error('[lava] a step link yields no edge pair', pose ? 'HIGH' : 'LOW', s.a.id || s.a.pt, '→', s.b.id || s.b.pt, A.length, B.length); }
    }
  }
  // the nearest node every lava-reached node can walk to that the lava never reaches (multi-source Dijkstra, reversed)
  _exits(nav, kind) {
    const N = nav.nodes.length, dist = new Float32Array(N).fill(Infinity), exit = new Int32Array(N).fill(-1);
    const radj = Array.from({ length: N }, () => []);
    for (const n of nav.nodes) for (const e of n.nb) if (e.type !== 'climb') radj[e.to].push([n.id, e.cost]);
    const heap = [], push = (id, d) => { heap.push([d, id]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    for (let i = 0; i < N; i++) if (!kind[i] && nav.valid[i]) { dist[i] = 0; exit[i] = i; push(i, 0); }
    while (heap.length) {
      const [d, u] = pop();
      if (d > dist[u]) continue;
      for (const [p, c] of radj[u]) { const nd = d + c; if (nd < dist[p]) { dist[p] = nd; exit[p] = exit[u]; push(p, nd); } }
    }
    return { exit, escD: dist };
  }

  dispose() {
    this.look?.dispose(); this.look = null;
    this._burnMesh?.geometry.dispose(); this._burnMesh?.material.dispose(); this._burnMesh = null;
    this.map?.dispose();
    if (this.paint && this.paint.clip && this.paint === G.paint) { /* (the paint system goes with the world) */ }
  }
}

// ================================================================================================== the match
export class StageLava {
  static create(m, W, S) {
    if (!W) return null;
    const sched = lavaSchedule(W.def, m.mode, m.duration, { practice: !!m.practice, attract: !!m.attract });
    if (!sched) return null;
    return new StageLava(m, W, S, sched);
  }

  constructor(m, W, S, sched) {
    this.m = m; this.W = W; this.S = S; this.sched = sched;
    this.clock = S.clock;
    this.navTimed = true;
    this.otAt = Infinity; this.held = null;
    this.riders = W.riders.map((r) => ({ r, blocks: [], top: r.sink ? -50 : r.top0, rel: r.sink ? r.sink.rel[0] : 0, solid: !r.sink, parked: !!r.sink, paint: null }));
    this.placed = false;
    this.st = lavaAt(0, sched);
    this.y = this.st.y;
    this.prev = { phase: this.st.phase, warn: this.st.warn, at: this.st.next?.at ?? null };
    this.burnY = this.y;
    this.sweepT = 0; this.botT = 0; this.mapKey = null; this.tickN = -1;
    this.stats = { deaths: [], byTeam: [0, 0], warned: 0, crossings: 0, burned: 0, sweeps: 0, devices: 0, fizzles: 0, events: [], lookout: {} };
    const W2 = W.navMeta;
    this.win = W2 ? { kind: W2.kind, shut: (id, t) => this.shut(id, t), now: () => this.clock.t, sPerM: LAVA.sPerM, soft: LAVA.soft } : null;
    if (G.nav && W2 && G.nav === W.nav) G.nav.lava = this.win;
    this._floatPaints();
    const q = heldFromQuery();
    if (q) this.hold(q);
    // Boss Battle holds the lava LOW: the Organs stand in level.dyn before BossNav rasterises the boss's ground (H21)
    if (m.mode === 'boss' || this.held) this.placeRiders();
    this.chip = m.attract ? null : new LavaHud(this);
    this._unsubs = [
      on('lava:warn', (e) => { if (e.to === 'high') this._call('warnRise', e.inS, true); else this._call('warnFall', Math.round(this._stoneDeadlyIn(e)), true); }),
      on('lava:move', (e) => { if (e.dir > 0) this._call('rise'); }),
      on('lava:rest', (e) => this._call(e.level === 'high' ? 'high' : 'low')),
      on('lava:hold', () => this._call('hold')),
      on('splatted', (e) => this._splatted(e)),
    ];
    W.setY(this.y, this.st);
  }

  // ----------------------------------------------------------------------- the clock
  now() { return this.clock.t; }
  yAt(t) { return lavaY(t, this.sched, this.otAt, this.held); }
  maxOver(t0, t1) { return lavaMax(t0, t1, this.sched, this.otAt, this.held); }
  hold(phase) {
    const lo = this.W.low, hi = this.W.high;
    const P = { low: { y: lo, e: 0, phase: 'low', dir: 0 }, high: { y: hi, e: 1, phase: 'high', dir: 0 },
      rise: { y: (lo + hi) / 2, e: 0.5, phase: 'rise', dir: 1 }, fall: { y: (lo + hi) / 2, e: 0.5, phase: 'fall', dir: -1 } }[phase];
    this.held = P ? { ...P, move: null } : null;
    this.seek(this.clock.t, 'debug');
  }
  // tests: jump the stage clock (everything re-derives at once, as on a follower's snap)
  debugT(t) {
    const m = this.m;
    if (!m.practice && Number.isFinite(m.duration) && m.duration > 0) m.time = Math.max(0.01, m.duration - t);   // (the clock follows the match's)
    this.clock.t = t; this.seek(t, 'debug');
  }

  update(dt, t) {
    const m = this.m;
    if (!this.placed && (m.state === 'playing' || m.attract || m.practice)) this.placeRiders();
    // overtime: a move already running finishes, then the lava holds; a warning not yet at its move is cancelled
    if (this.otAt === Infinity && (m.zones?.overtime || m.tower?.overtime || m.karp?.overtime || m.bazookarp?.overtime)) {
      this.otAt = t;
      emit('lava:hold', { level: this.st.e > 0.5 ? 'high' : 'low', why: 'overtime' });
    }
    const st = (this.st = lavaAt(t, this.sched, this.otAt, this.held));
    this.y = st.y;
    this._events(st, t);
    this._riders(t, st, false);
    this._floors();
    this._burn(false);
    if ((this.sweepT -= dt) <= 0) { this.sweepT = 0.25; if (st.dir > 0 || this._riderChanged) { this.sweepDevices(); this._riderChanged = false; } }
    if ((this.botT -= dt) <= 0) { this.botT = st.warn || st.dir ? 0.5 : 1.5; this._replanBots(t); }
    this._lookout(dt);
    this.W.setY(this.y, st);
    this.W.look?.update(dt, t, st, this);
    this._heat();
  }

  // a jump of the stage clock (a follower's snap, a late joiner, a debug jump): re-derive everything at once
  seek(t, why) {
    const st = (this.st = lavaAt(t, this.sched, this.otAt, this.held));
    this.y = st.y;
    this.prev = { phase: st.phase, warn: st.warn, at: st.next?.at ?? null };
    if (this.placed) this._riders(t, st, true);
    this._floors();
    if (this.placed) this.sweepDevices();
    if (why === 'late') this.burnY = this.y;   // (the imported grid already has no ink under the lava)
    else this._burn(true);
    this.W.setY(this.y, st);
    this.W.look?.update(0, t, st, this);
    emit('lava:set', { y: +this.y.toFixed(3), phase: st.phase, why });
    // own squidkids whose floor is now under the lava: shoved to the nearest dry node (else they die as they would have)
    if (why === 'clock') this._escapeShove();
  }

  _events(st, t) {
    const P = this.prev, T = this.sched.T, au = this.m.attract ? null : G.audio;   // (the menu backdrop rises and falls in silence)
    if (st.warn && !(P.warn && P.at === st.next.at)) {
      const n = st.next;
      emit('lava:warn', { to: n.to, at: n.at, inS: Math.round(n.inS), dir: n.dir });
      this._log('warn', t, n.to);
      if (n.to === 'high') { au?.play('lava_bell'); this._rumble(0.9); }
      else au?.play('lava_whistle', { params: { kind: 'warn' } });
    }
    // the countdown's last 3 s
    if (st.warn) { const k = Math.ceil(st.next.inS); if (k <= 3 && k >= 1 && k !== this.tickN) { this.tickN = k; au?.play('lava_tick', { pitch: st.next.to === 'high' ? 1 : 0.8 }); } }
    else this.tickN = -1;
    if (st.phase !== P.phase) {
      if (st.phase === 'rise' || st.phase === 'fall') {
        const m = st.move;
        emit('lava:move', { dir: st.dir, from: st.dir > 0 ? this.W.low : this.W.high, to: st.dir > 0 ? this.W.high : this.W.low, dur: m ? m.dur : T.rise, at: m ? m.t0 : t });
        this._log('move', t, st.phase);
        if (st.dir > 0) { au?.play('lava_erupt'); au?.play('lava_siren_up'); emit('shake', { amount: 0.25, dur: 0.6 }); this._rumble(0.9); }
        else { au?.play('lava_hiss'); au?.play('lava_siren_down'); this._rumble(0.5); this._drain(true); }
      } else {
        emit('lava:rest', { level: st.phase, y: +st.y.toFixed(3) });
        this._log('rest', t, st.phase);
        if (st.phase === 'low') { au?.play('lava_whistle', { params: { kind: 'clear' } }); this._drain(false); }
        else au?.play('lava_lock');
        this._rumble(0.15);
      }
    }
    P.phase = st.phase; P.warn = st.warn; P.at = st.next?.at ?? null;
  }
  _log(k, t, v) { const E = this.stats.events; if (E.length < 400) E.push([k, +t.toFixed(2), v]); }
  _call(key, n, big = false) {
    const T = this.W.def.text || {}, row = T[key];
    if (!row || this.m.attract) return;
    const sub = row[1] ? row[1].replace('{n}', n != null ? String(n) : '') : '';
    this.S.callout(row[0], sub, big);
  }
  // s from a fall warning to the moment the stones turn deadly (the ledges dry)
  _stoneDeadlyIn(e) {
    const S = this.sched, k = this.W.riders.find((r) => r.sink)?.sink, at = k ? k.at : this.W.low + 0.45;
    const tc = crossTime({ t0: e.at, dir: -1, dur: e.dur || S.T.fall }, at, S);
    return tc === null ? e.inS : tc - this.clock.t;
  }

  // ----------------------------------------------------------------------- riders
  placeRiders() {
    if (this.placed || !G.level) return;
    this.placed = true;
    for (const R of this.riders) {
      R.blocks = R.r.parts.map((p, k) => {
        const b = G.level.addDynamic({ tag: 'lava:' + R.r.id + ':' + k, perch: R.r.kind === 'stone' && p.body, roof: !p.body && p.roof !== false });
        b.lavaRider = R;
        if (p.body && R.paint && R.paint[k]) b.inkPaint = R.paint[k];
        return b;
      });
    }
    this._riders(this.clock.t, this.st, true);
  }
  _riders(t, st, snap) {
    const S = this.sched, kill = LAVA.kill;
    for (const R of this.riders) {
      const r = R.r;
      let top, solid = true;
      if (r.sink) { R.rel = stoneRel(r, t, S, st); top = st.y + R.rel; solid = R.rel >= kill - 1e-9; }
      else top = riderTop(r, st.y, S);
      const parked = r.sink && R.rel <= r.sink.rel[0] + 1e-4;
      if (r.sink && solid !== R.solid) {
        emit('lava:rider', { id: r.id, up: solid });
        if (solid) G.audio?.play('lava_pop', { pos: _v.set(r.x, st.y, r.z), volume: 0.6 });
        this._riderChanged = true;
      }
      R.top = top; R.solid = solid; R.parked = parked;
      if (!R.blocks.length) continue;
      r.parts.forEach((p, k) => {
        const b = R.blocks[k];
        if (parked) { G.level.moveDynamic(b, _v.set(r.x, -50, r.z), _v2.set(0.1, 0.1, 0.1), 0); b.solid = false; return; }
        const q = partPose(r, p, top, _pp);
        G.level.moveDynamic(b, _v.set(q.cx, q.cy, q.cz), _v2.set(q.hx, q.hy, q.hz), q.yaw);
        b.solid = solid;
        if (snap) b.dp?.set(0, 0, 0);
      });
      if (R.frame) R.frame.pos.set(r.x, top - r.depth, r.z);
    }
  }
  // the floats' ink: one deck paint per hex rider (its bounding square; the hexagon is what you see and stand on), the
  // lookout's six sides on its column boxes' short faces (ink: 'all'); each body block's inkPaint reads both
  _floatPaints() {
    for (const R of this.riders) {
      const r = R.r;
      if (r.kind === 'stone' || !r.ink) continue;
      const frame = (R.frame = { pos: new THREE.Vector3(r.x, r.top0 - r.depth, r.z), yaw: r.yaw });
      const hx = r.shape === 'hex' ? r.r : r.parts[0].hx, hz = r.shape === 'hex' ? (Math.sqrt(3) * r.r) / 2 : r.parts[0].hz;
      const deck = new MaskPaint(frame, { hx, hz, h: r.depth, rim: 0.12, ppm: 40 }, ['deck']);
      const sides = r.ink === 'all' ? r.parts.map((p) => (p.body ? new MaskPaint({ pos: frame.pos, get yaw() { return r.yaw + p.yaw; } }, { hx: p.hx, hz: p.hz, h: r.depth, ppm: 32 }, ['+z', '-z']) : null)) : null;
      R.deck = deck; R.sides = sides;
      R.paint = r.parts.map((p, k) => (p.body ? { groundTeam: (pos) => deck.groundTeam(pos), wallTeam: (pos, n) => (sides && sides[k] ? sides[k].wallTeam(pos, n) : 0), deck, side: sides && sides[k] } : null));
      R.paint.deck = R.paint[0];
    }
  }

  // ----------------------------------------------------------------------- floors, burn, devices
  _floors() {
    const y = this.y;
    for (const d of this.W.drown) { const gone = y > d.top + LAVA.gone; if (d.b.absent !== gone) { d.b.solid = !gone; d.b.absent = gone; } }
  }
  _burn(force) {
    const W = this.W, P = W.paint, C = W.cells;
    if (!P || !C) return;
    const y = this.y;
    if (y < this.burnY - 0.02) { this.burnY = y; return; }   // (a fall: nothing burns; the pointer follows it down)
    if (y <= this.burnY + 0.004 && !force) return;
    // cells whose centres the surface passed since the last burn: the sorted list's slice (burnY, y]
    const lo = lowerBound(C.y, this.burnY - (force ? 1 : 0)), hi = lowerBound(C.y, y);
    if (hi > lo) {
      const sample = [];
      const n = P.clearCells(C.ids.subarray(lo, hi), sample, 24);
      this.stats.burned += n;
      if (n) this.W.look?.steam(sample, P);
      if (n && G.time - (this._sizT || -9) > 0.12) { this._sizT = G.time; G.audio?.play('lava_sizzle', { volume: 0.5 }); }
    }
    W.burnAtlas(y);
    this.burnY = y;
  }
  // the owner's sweep: every device of this screen's that the lava has reached (or a sinking stone took) is destroyed
  // with a sizzle, no blast, no ink; its owner's end record ends the ghosts everywhere. (Module-private until the subs
  // package's G.deploy.crushIn lands: then S.crushIn({ where: (p) => this.under(p, -0.05) }, 'lava') replaces the walk.)
  sweepDevices() {
    this.stats.sweeps++;
    let n = this.S.crushIn({ where: (p) => this.under(p, -0.05) }, 'lava');
    const items = G.subs?.items;
    if (items) for (const it of items) {
      if (it.ghost || !DEVICE_STATES.has(it.state) || !it.pos) continue;
      if (!this.under(it.pos, -0.05)) continue;
      this.fizzle(it.pos, 'device');
      G.subs._destroy(it);
      emit('device:down', { kind: it.kind, team: it.team, pos: it.pos.clone(), by: null, how: 'lava' });
      n++;
    }
    this.stats.devices += n;
    return n;
  }

  // ----------------------------------------------------------------------- queries (the subs read these names)
  surfaceAt(x, z) { return this.W.inRegion(x, z) ? this.y : -Infinity; }
  liquidY(x, z) { return this.surfaceAt(x, z); }
  under(p, depth = 0) { return p.y < this.y + LAVA.kill - depth && this.W.inRegion(p.x, p.z); }
  // feet on a floor at gy at (x, z) would splat now or within `ahead` s
  covers(x, z, gy, ahead = 0) { if (!this.W.inRegion(x, z)) return false; const y = ahead > 0 ? this.maxOver(this.clock.t, this.clock.t + ahead) : this.y; return gy < y + LAVA.kill; }
  wet(x, z, gy, ahead = 0) { return this.covers(x, z, gy, ahead); }
  burns(a) { return !!a && a.alive && !a.superJumpState && this.under(a.pos); }
  // no device is placed where the lava will be within the next warning + move (the rising surface's reach)
  noPlace(p, r = 0) { if (!this.W.inRegion(p.x, p.z)) return false; const T = this.sched.T; return p.y < this.maxOver(this.clock.t, this.clock.t + T.warn + T.rise + 1) + LAVA.kill + 0.05; }
  danger(pos, pad = 0.5) { return this.covers(pos.x, pos.z, pos.y - pad * 0.2, 10); }
  // the height below which ink may not land in the region, for a splat painted at stage time et
  inkClip(et) { const now = this.clock.t; if (et === undefined || et === null) return this.y; return et < now ? this.maxOver(et, now) : this.yAt(et); }
  splatTime(c, radius) {
    const B = this.W.box, r3 = radius * 3;
    if (c.y - r3 > this.W.high + 0.1) return undefined;
    if (c.x + r3 < B.x0 || c.z + r3 < B.z0 || c.x - r3 > B.x0 + B.nx * RES || c.z - r3 > B.z0 + B.nz * RES) return undefined;
    return +this.clock.t.toFixed(2);
  }
  // a splat: the floats' own ink; a sizzle where it lands in the lava
  onSplat(c, r, team, opts) {
    for (const R of this.riders) {
      if (!R.deck || !R.blocks.length) continue;
      if (Math.abs(c.x - R.r.x) > R.r.r + r + 3 || Math.abs(c.z - R.r.z) > R.r.r + r + 3) continue;
      R.deck.splat(c, r, team, { seed: opts?.seed });
      if (R.sides) for (const s of R.sides) s?.splat(c, r, team, { seed: opts?.seed });
    }
    if (this.under(c, -0.2) && G.time - (this._splT || -9) > 0.2) { this._splT = G.time; this.fizzle(c, 'ink'); }
  }
  fizzle(p, what) {
    this.stats.fizzles++;
    this.W.look?.fizzle(p, what);
    if (G.time - (this._fzT || -9) > 0.08) { this._fzT = G.time; G.audio?.play('lava_sizzle', { pos: p.clone ? p.clone() : new THREE.Vector3(p.x, p.y, p.z), volume: 0.45 }); }
  }
  // Bazookarp: 1 = standable at that rest, per nav node (pure: from the nodes' kinds and poses)
  restMask(level) {
    const M = this.W.navMeta, nav = this.W.nav;
    if (!M || (level !== 'low' && level !== 'high')) return null;
    const key = '_rm_' + level;
    if (this[key]) return this[key];
    const N = M.kind.length, out = new Uint8Array(N), H = level === 'high';
    for (let i = 0; i < N; i++) {
      if (!nav.valid[i]) continue;
      const k = M.kind[i];
      if (k === 0) out[i] = 1;
      else if (k === 1) out[i] = H ? 0 : 1;
      else out[i] = M.pose[i] === (H ? 1 : 0) ? 1 : 0;
    }
    return (this[key] = out);
  }
  get reach() { return this.W.navMeta?.reach || null; }
  closedNow(id) { return this.shut(id, this.clock.t) > 0; }
  // the volumes the riders sweep over their whole travel (Bazookarp's rest flags)
  sweeps(out) {
    for (const R of this.riders) {
      const r = R.r, t0 = r.sink ? this.W.low + r.sink.rel[0] : r.top0, t1 = r.sink ? this.W.high + r.sink.rel[1] : r.top1;
      for (const p of r.parts) { const q = partPose(r, p, t1, {}); out.push({ x: q.cx, z: q.cz, hx: q.hx, hz: q.hz, yaw: q.yaw, y0: t0 - r.depth, y1: t1 + Math.max(0, p.y1) }); }
    }
    return out;
  }

  // ----------------------------------------------------------------------- actors (this screen's own)
  kill(a) {
    if (!this.burns(a)) return false;
    const by = a.lastDamage < 4 ? a.lastAttacker : null;
    this.W.look?.splash(a.pos, a.team);
    G.audio?.play('lava_sizzle', { pos: a.pos.clone(), volume: 1 });
    a.splat(by, 'lava');
    return true;
  }
  fallCause(a) { return this.W.fallsIn(a.pos.x, a.pos.z) ? 'lava' : null; }
  // a super jump whose landing will be under the lava (or on a stone that won't be there) lands on the nearest node dry
  // at its arrival instead (≤ 12 m), else on the jumper's own pad
  superJumpLanding(a, s) {
    const t1 = this.clock.t + (s.dur || 1.5), to = s.to;
    const lost = (x, z, y) => {
      if (this.W.inRegion(x, z) && y < this.maxOver(this.clock.t, t1 + 1.5) + LAVA.kill + 0.05) return true;
      for (const R of this.riders) if (R.r.sink && inRider(R.r, x, z, 0.3) && Math.abs(y - R.top) < 0.6 && !this._stoneUpAt(R, t1 + 1.5)) return true;
      return false;
    };
    if (!lost(to.x, to.z, to.y)) return;
    const nav = G.nav, M = this.W.navMeta;
    let best = -1, bd = Infinity;
    if (nav) for (const n of nav.nodes) {
      if (!nav.valid[n.id]) continue;
      const d = Math.hypot(n.x - to.x, n.z - to.z) + Math.abs(n.y - to.y) * 0.5;
      if (d > 12 || d >= bd) continue;
      if (M && M.kind[n.id] === 2) continue;
      if (M && M.kind[n.id] === 1 && this.maxOver(this.clock.t, t1 + 8) >= M.shutY[n.id]) continue;
      if (lost(n.x, n.z, n.y)) continue;
      bd = d; best = n.id;
    }
    if (best >= 0) { const n = nav.nodes[best]; to.set(n.x, n.y, n.z); }
    else { const pad = G.level.spawnPads[a.team]; if (pad) to.copy(pad); }
    this.stats.redirects = (this.stats.redirects || 0) + 1;
  }
  _stoneUpAt(R, t) { const st = lavaAt(t, this.sched, this.otAt, this.held); return stoneRel(R.r, t, this.sched, st) >= LAVA.kill; }
  // a snap put someone's floor under the lava: shove them to the nearest node dry for 8 s
  _escapeShove() {
    const nav = G.nav, M = this.W.navMeta;
    if (!nav || !M) return;
    for (const a of this.m.actors) {
      if (!a.alive || a.remote || a.superJumpState || !this.covers(a.pos.x, a.pos.z, a.pos.y, 0.3)) continue;
      const s = nav.nearest(a.pos, 1.2, true), e = s >= 0 ? M.exit[s] : -1;
      if (e < 0) continue;
      const n = nav.nodes[e];
      if (Math.hypot(n.x - a.pos.x, n.z - a.pos.z) > 12) continue;
      a.pos.set(n.x, n.y + 0.05, n.z); a.vel.set(0, 0, 0);
    }
  }
  _splatted(e) {
    if (e?.cause !== 'lava' || !e.victim) return;
    const v = e.victim, st = this.st;
    // a "warned" lava death: during a rise, its warning, or HIGH (the surge's own), i.e. any rise the HUD announced
    const warned = st.phase !== 'low' || st.warn;
    this.stats.byTeam[v.team] = (this.stats.byTeam[v.team] || 0) + 1;
    if (warned) this.stats.warned++;
    if (this.stats.deaths.length < 200) this.stats.deaths.push({ t: +this.clock.t.toFixed(1), team: v.team, bot: !!v.isBot, x: +v.pos.x.toFixed(1), z: +v.pos.z.toFixed(1), y: +v.pos.y.toFixed(2), phase: st.phase, warn: st.warn, by: !!e.attacker });
  }
  _lookout(dt) {
    // (stats for the bot targets: seconds a long-range bot stands on an Organ lookout's HIGH pose)
    if (!this.placed || this.st.phase !== 'high') return;
    for (const a of this.m.actors) {
      if (!a.alive || !a.grounded || a.ground?.block === undefined) continue;
      const b = G.level.blocks[a.ground.block];
      if (!b || !b.lavaRider || b.lavaRider.r.kind === 'stone') continue;
      const k = b.lavaRider.r.base;
      this.stats.lookout[k] = (this.stats.lookout[k] || 0) + dt;
    }
  }

  // ----------------------------------------------------------------------- nav windows and bots
  // 0 open, 1 soft (shut at t or within 2 s: a floor under lava), 2 hard (a rider node whose rider isn't at its pose)
  shut(id, t) {
    const M = this.W.navMeta;
    if (!M) return 0;
    const k = M.kind[id];
    if (k === 0) return 0;
    if (k === 1) {   // (from the cached intervals of time the lava stands at or over this height: A* asks this per edge)
      const iv = this._floorIv(M.shutY[id]), t1 = t + LAVA.floorAhead;
      for (let i = 0; i < iv.length; i += 2) if (iv[i] <= t1 && iv[i + 1] >= t) return 1;
      return 0;
    }
    const R = this.riders[M.rider[id]];
    if (!R) return 2;
    const off = (tt) => {
      const st = lavaAt(tt, this.sched, this.otAt, this.held);
      let top;
      if (R.r.sink) { const rel = stoneRel(R.r, tt, this.sched, st); if (rel < LAVA.kill) return true; top = st.y + rel; }
      else top = riderTop(R.r, st.y, this.sched);
      return Math.abs(top - M.top[id]) > LAVA.poseTol;
    };
    if (off(t)) return 2;
    return off(t + 2) ? 1 : 0;
  }
  // the intervals of stage time over the next minute when L ≥ y (flat [a0, b0, a1, b1, …]), cached for this clock time
  _floorIv(y) {
    const now = this.clock.t;
    if (this._ivT !== now) { this._ivT = now; this._iv = new Map(); }
    let iv = this._iv.get(y);
    if (iv) return iv;
    iv = [];
    const S = this.sched, hz = now + 60;
    if (this.held || S.kind === 'fixed') { if (this.yAt(now) >= y) iv.push(-Infinity, Infinity); }
    else {
      // L is monotone between move boundaries: walk the boundaries, find the crossings
      const pts = [now]; for (let t = now; t < hz; ) { const st = lavaAt(t, S, this.otAt); if (!Number.isFinite(st.toGo)) break; t += Math.max(1e-3, st.toGo); pts.push(Math.min(t, hz)); }
      if (pts[pts.length - 1] < hz) pts.push(hz);
      let open = this.yAt(now) >= y ? -Infinity : null;
      for (let i = 0; i + 1 < pts.length; i++) {
        const a = pts[i], b = pts[i + 1], ya = this.yAt(a), yb = this.yAt(b + 1e-4 > b ? b : b);
        if (open === null && yb >= y) { let lo = a, hi = b; for (let k = 0; k < 24; k++) { const c = (lo + hi) / 2; if (this.yAt(c) >= y) hi = c; else lo = c; } open = hi; }
        else if (open !== null && yb < y && ya >= y) { let lo = a, hi = b; for (let k = 0; k < 24; k++) { const c = (lo + hi) / 2; if (this.yAt(c) >= y) lo = c; else hi = c; } iv.push(open, lo); open = null; }
      }
      if (open !== null) iv.push(open, Infinity);
    }
    this._iv.set(y, iv);
    return iv;
  }
  navEdge(e, to, metres) {
    const M = this.W.navMeta;
    if (!M || !M.kind[to]) return 0;
    const s = this.shut(to, this.clock.t + metres * LAVA.sPerM);
    return s === 2 ? Infinity : s ? LAVA.soft : 0;
  }
  navNode(id, start) {
    const M = this.W.navMeta;
    if (!M || !M.kind[id]) return true;
    const t = this.clock.t;
    if (M.kind[id] === 2) { if (this.shut(id, t) === 2) return false; return start || this.shut(id, t + 4) === 0; }
    if (start) return true;
    return this.maxOver(t, t + LAVA.goalLook) < M.shutY[id];
  }
  // paint goals: never floor the lava takes soon, nor a rider leaving its pose; the Organ lookouts while they stand at a
  // pose are worth going up (the lookout ×2.2, the steps ×1.4: the matches showed bots seldom went up on their own)
  goalWeight(id) {
    const M = this.W.navMeta;
    if (!M || !M.kind[id]) return 1;
    if (!this.navNode(id, false)) return 0.02;
    if (M.kind[id] === 2) { const r = this.W.riders[M.rider[id]]; if (r && !r.sink) return r.look?.role === 'lookout' ? 2.2 : 1.4; }
    return 1;
  }
  // every bot whose route runs onto a node shut at its arrival re-plans (the warning, the rise, a window closing)
  _replanBots(t) {
    const M = this.W.navMeta, nav = G.nav;
    if (!M || !nav || nav !== this.W.nav) return;
    let k = 0;
    for (const a of this.m.actors) {
      const b = a.bot;
      if (!b || !b.path || !a.alive) continue;
      let metres = 0, bad = false;
      for (let i = Math.max(1, b.pi || 0); i < b.path.length; i++) {
        const u = nav.nodes[b.path[i - 1]], v = nav.nodes[b.path[i]];
        if (!u || !v) break;
        metres += Math.hypot(v.x - u.x, v.z - u.z);
        if (M.kind[v.id] && this.shut(v.id, t + metres * LAVA.sPerM)) { bad = true; break; }
      }
      if (bad && !b._lavaEsc) { b.path = null; b.repath = 0.06 * (k++ % 6); b.goalTimer = 0; }   // (staggered: not every route in one frame)
    }
  }
  // bots.js: escape a drowning floor or a sinking stone (still shooting: the aim is the brain's), else null
  botAct(b, dt, it, move, vis) {
    const a = b.a, M = this.W.navMeta, nav = G.nav;
    if (!M || !nav || nav !== this.W.nav || !a.alive) return null;
    b._lavaT = (b._lavaT || 0) - dt;
    if (b._lavaT <= 0) {
      b._lavaT = 0.25;
      const s = nav.nearest(a.pos, 1.2, true), k = s >= 0 ? M.kind[s] : 0, t = this.clock.t;
      let need = false;
      const esc = (M.escD[s] || 0) / LAVA.escape[0] + LAVA.escape[1];
      if (k === 1) { const left = this._timeTo(M.shutY[s], t, 16); need = left < esc; }
      else if (k === 2) { const R = this.riders[M.rider[s]]; if (R && R.r.sink) need = this.shut(s, t + 4) === 2 || this.shut(s, t + esc) === 2; }
      if (need && M.exit[s] >= 0 && M.exit[s] !== s) {
        if (!b._lavaEsc || b.goal !== M.exit[s]) {
          const p = nav.path(s, M.exit[s], a.team);
          if (p) { b.path = p; b.pi = Math.min(1, p.length - 1); b.goal = M.exit[s]; b.bestD = Infinity; b.noProg = 0; b._lavaEsc = true; b.escN = (b.escN || 0) + 1; }
        }
      } else if (b._lavaEsc && (k === 0 || !need)) b._lavaEsc = false;
      if (b._lavaEsc) { b.repath = Math.max(b.repath || 0, 0.6); b.goalTimer = Math.max(b.goalTimer || 0, 0.6); }
    }
    if (b._lavaEsc && b.path) {
      const mv = b._steer(dt); if (mv !== move) move.copy(mv);
      // up the hop out (a 1.2 m step onto the head, the causeway, the island): ask for the jump, and again if it stalls
      // there — the brain presses it (its own cool-down: a held button would never jump twice)
      const nx = b.pi < b.path.length ? nav.nodes[b.path[b.pi]] : null;
      if ((nx && nx.y - a.pos.y > 0.4 && Math.hypot(nx.x - a.pos.x, nx.z - a.pos.z) < 1.6) || b.noProg > 0.8) b._needJump = true;
      it.squid = false;
    }
    return null;
  }
  // s until L reaches y from t (looking `horizon` s ahead; Infinity if not)
  _timeTo(y, t, horizon) {
    if (this.yAt(t) >= y) return 0;
    if (this.maxOver(t, t + horizon) < y) return Infinity;
    let a = t, b = t + horizon;
    for (let k = 0; k < 24; k++) { const c = (a + b) / 2; if (this.maxOver(t, c) >= y) b = c; else a = c; }
    return b - t;
  }

  // ----------------------------------------------------------------------- looks, HUD, maps
  _rumble(level) { this._rumbleWant = level; if (!this.m.attract) this.W.look?.rumble(level); }
  _drain(on) { if (!this.m.attract) this.W.look?.drain(on); }
  _heat() {
    const sfx = G.game?.screenfx, cam = G.camera, q = G.settings?.quality;
    if (!sfx || !cam || this.m.attract) return;
    if (q === 'low' || q === 'medium') { sfx.heat = 0; return; }
    const ly = this.surfaceAt(cam.position.x, cam.position.z);
    const near = ly > -Infinity ? Math.max(0, 1 - (cam.position.y - ly) / 6) : 0;
    sfx.heat = Math.min(1, near * 0.35 * (this.st.dir ? 2 : 1));
  }
  drawMap(c, mm, tc, s, hex, t) { drawLavaMap(this, c, mm, tc, s, t); }
  // the HUD's object (and the gauge chip's own DOM), every frame for the local player
  hud(a) {
    const st = this.st, n = st.next;
    const mine = a && a.alive && a.isLocal ? this._mine(a) : null;
    const o = { e: +st.e.toFixed(3), dir: st.dir, phase: st.phase, inS: n ? Math.max(0, n.inS) : null, to: n ? n.to : null, warn: st.warn, mine, toGo: st.toGo };
    this.chip?.update(o, a);
    return o;
  }
  _mine(a) {
    const M = this.W.navMeta, nav = G.nav;
    if (!M || !nav || nav !== this.W.nav) return null;
    const s = nav.nearest(a.pos, 1.2, true);
    if (s < 0 || !M.kind[s]) return null;
    const t = this.clock.t;
    if (M.kind[s] === 1) {
      const left = this._timeTo(M.shutY[s], t, 14);
      if (!Number.isFinite(left)) return null;
      return this._line('GET OFF THE LOW GROUND', a, M.exit[s], left);
    }
    const R = this.riders[M.rider[s]];
    if (!R || !R.r.sink) return null;
    const left = this._stoneLeft(R, t, 16.5);
    if (!Number.isFinite(left)) return null;
    return this._line('THE STONES ARE SINKING', a, M.exit[s], left);
  }
  _stoneLeft(R, t, h) { for (let dt = 0; dt <= h; dt += 0.25) if (!this._stoneUpAt(R, t + dt)) return dt; return Infinity; }
  _line(text, a, exitId, left) {
    const n = exitId >= 0 ? G.nav.nodes[exitId] : null;
    const d = n ? Math.hypot(n.x - a.pos.x, n.z - a.pos.z) : 0;
    return { text, m: Math.max(1, Math.round(d)), to: n ? [n.x, n.z] : null, left: Number.isFinite(left) ? +left.toFixed(1) : null };
  }

  state() {
    const st = this.st;
    return { t: +this.clock.t.toFixed(3), y: +st.y.toFixed(4), e: +st.e.toFixed(4), phase: st.phase, dir: st.dir, warn: st.warn, next: st.next ? { to: st.next.to, at: st.next.at, inS: +st.next.inS.toFixed(2) } : null,
      held: this.held ? this.held.phase : null, otAt: Number.isFinite(this.otAt) ? this.otAt : null, key: this.sched.key, placed: this.placed,
      riders: this.riders.map((R) => ({ id: R.r.id, top: +R.top.toFixed(3), solid: R.solid, parked: R.parked })),
      drowned: this.W.drown.filter((d) => d.b.absent).length, burnY: +this.burnY.toFixed(3), stats: this.stats };
  }

  dispose() {
    for (const u of this._unsubs || []) u();
    this._unsubs = null;
    this.chip?.dispose(); this.chip = null;
    for (const d of this.W.drown) { d.b.solid = true; d.b.absent = false; }
    for (const R of this.riders) { R.deck?.dispose(); if (R.sides) for (const s of R.sides) s?.dispose(); R.blocks = []; }
    if (this.placed) G.level?.clearDynamic?.();
    if (G.nav && G.nav.lava === this.win) G.nav.lava = null;
    this.W.look?.reset();
    this.W.setY(this.W.low, null);
    if (G.game?.screenfx) G.game.screenfx.heat = 0;
  }
}
// subs items the sweep ends (placed, stuck or running devices; not thrown subs in flight, clouds or mist)
const DEVICE_STATES = new Set(['spray', 'beacon', 'curtain', 'mine', 'stuck', 'run', 'prime']);

function lowerBound(arr, v) { let a = 0, b = arr.length; while (a < b) { const m = (a + b) >> 1; if (arr[m] <= v) a = m + 1; else b = m; } return a; }

// ================================================================================================== registration
registerStageMod({
  key: 'lava', order: 20, worldAs: 'lavaWorld', matchAs: 'lava', liquid: true,
  world: (ctx) => new LavaWorld(ctx),
  match: (m, W, S) => StageLava.create(m, W, S),
});
void PLAYER; void UP; void _c; void _h;
