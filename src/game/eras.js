// Bluestone Junction's eras — Commander Tartar winds the clock: the stage module for LAYOUT.eras (the contract:
// tools/botlab/jobs/batch5/stages/bluestone/ENGINE.md; the design: DESIGN.md §3, §5, §8.6; the registry: docs/STAGE-MODS.md
// "Bluestone Junction: eras", which says which registry hook serves each ENGINE.md item — no shared file is edited here).
//
// ONE UNION WORLD holds every era's pieces at once; each piece carries the eras it exists in (b.presence, a bit mask:
// era 1 = 1, era 2 = 2, era 3 = 4; 0 = every era). Everything derived from geometry is built for all three eras at load,
// so a jump is a set of cheap switches and never a rebuild:
//   • the Level: face hiding, the grounded-bottom test and bevels ask only blocks present in every era of the face's own
//     block (the registry's presence), so a face pressed against a block of another era keeps its faces; every vertex
//     carries aEra = (mask, r_g)
//   • paint: per cell, the eras it is live in (its face's eras, minus the eras of any block burying it); turf totals and
//     counts follow every flip cell by cell; a piece that vanishes takes its ink (its cells stop counting at its flip and
//     are zeroed, grid and atlas, at done + 1 s); a piece that appears arrives blank (cleared at the warning) and takes no
//     ink until 0.5 s after its flip (the guard); ground in both eras keeps its ink
//   • nav: three graphs (one per era's solidity) merged into one union graph: nodes by (cell, height), edges keyed
//     (from, to, type, cost) with an era mask e.em; per-era valid / exitable / validIds / wet columns; nav.edgeMask is the
//     era in force (so every cached node id stays meaningful)
//   • looks: one level mesh per era mask (built while every block is solid), tagged prop buckets per mask, the level
//     shader's chunks (src/fx/eraFx.js), backdrop sets per era, the minimap's base per era
// A JUMP is a pure function of the shared stage clock (the host's match clock every follower tracks: nothing new goes
// over the wire in a match): at J the front leaves Tartar at (0, 0) at 25 m/s and each GROUP (an eraGroup on one half)
// switches whole — looks, collision, ink and nav agree — when the front reaches the centre of its members' union AABB
// (r_g), at J + r_g / 25. Schedule per mode (eras-data.js eraSchedule): jumps at 1/3 and 2/3 of regulation time; Boss
// Battle fixed in era 2; Practice and the menu backdrop cycle 1 → 2 → 3 → 1 (the rewind); overtime never jumps;
// ?era=n (PAGEQ='era=2') starts in era n and never jumps (the audits).
// Fair (ENGINE §4.2): an own squidkid a piece appears in is shoved out with its body fitting (straight up first;
// stats.eraShoves counts them, a bot match expects 0); one left over water or on a roof with nothing walkable within
// 3.4 m below after a flip is rescued to the nearest valid node, never splatted; this screen's own devices on a vanishing
// piece (or inside an appearing one) are destroyed (S.crushIn, the registry's one destroyer; until the subs package adds
// G.deploy.crushIn, the module-private walk of G.subs.items). Warned: the pre-bell at J − 20, Tartar's ring and every
// kiosk at J − 10 with holograms of what appears, sepia flicker on what goes, the minimap's outlines and the bots'
// danger layer, the HUD's countdown J − 10 … J − 1, the pickup at J − 1, the front, the done callout.
import * as THREE from 'three';
import { G, emit, on } from '../core/ctx.js';
import { PLAYER } from '../config.js';
import { registerStageMod } from './stageMods.js';
import { Level } from '../world/level.js';
import { NavGraph } from './nav.js';
import { navClaim, navCommit, navRelease, navNodesInBox, shovable, shoveActor } from './stageKit.js';
import { eraMask, eraBit, hasEra, groupKey, eraSchedule, cycleJumps, eraPieces, eraGroups } from '../world/eras-data.js';
import { eraLevelExt, eraMaterial, eraDepthMaterial, patchSetClip, EraFx, EraHud, drawEraMap } from '../fx/eraFx.js';
import '../audio/sfx-eras.js';

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const _p = new THREE.Vector3(), _q = new THREE.Vector3(), _c = new THREE.Color(), _UP = new THREE.Vector3(0, 1, 0);
// the devices a flip pops when their piece goes (DESIGN §3.7: sprinkler, beacon, Drip Curtain, Lurk Mine, Cling Charge —
// placed or stuck; a running / winding-up Skitter Bomb and the clouds follow the ground or the air as before)
const RESTING = new Set(['stuck', 'spray', 'curtain', 'mine', 'beacon']);
const DEG = Math.PI / 180;

// the presence fields (docs/STAGE-MODS.md "Level"): a def or a prop collider carrying `eras` / `eraGroup`
Level.blockField('eras', (b, d, level) => { b.eras = eraMask(d.eras); b.presence = b.eras === 7 ? 0 : b.eras; level.presenceAll = 7; });
Level.blockField('eraGroup', (b, d) => { b.eraGroup = d.eraGroup; });

// the audit switch: ?era=1|2|3 starts the match in that era and never jumps (PAGEQ='era=2' on the botlab harnesses)
function auditEra() {
  let v = null;
  try { if (typeof location !== 'undefined' && location.search) v = new URLSearchParams(location.search).get('era'); } catch (e) { /* no page */ }
  const n = v ? +v : 0;
  return n === 1 || n === 2 || n === 3 ? n : 0;
}
// the stage-art switch (DESIGN §5.8, ENGINE T3): ?erafrom=a&erato=b&front=r — the world frozen mid-jump, era a outside a
// front stopped at radius r m and era b inside it (each group's solidity, the shader's front, the props, the curtain and
// the holograms at r; each piece whole on its side, not mid-dissolve; the sky stays era a's); the clock never moves it.
// PAGEQ='erafrom=1&erato=2&front=30', or ERA_FROM=1 ERA_TO=2 FRONT=30 on the botlab harnesses (stageart.cjs, shoot.cjs …)
function auditFront() {
  let q = null;
  try { if (typeof location !== 'undefined' && location.search) q = new URLSearchParams(location.search); } catch (e) { /* no page */ }
  if (!q || !q.has('erafrom')) return null;
  const a = +q.get('erafrom'), b = +q.get('erato'), r = +q.get('front'), ok = (n) => n === 1 || n === 2 || n === 3;
  return ok(a) && ok(b) && a !== b && Number.isFinite(r) && r >= 0 ? { from: a, to: b, front: r } : null;
}

// ================================================================================================== the world
export class EraWorld {
  constructor(ctx) {
    const E = (this.E = ctx.data);
    this.names = E.names || ['1880s', 'TODAY', '3000s'];
    this.speed = E.speed || 25; this.guard = E.guard ?? 0.5; this.warn = E.warn ?? 10; this.prebell = E.prebell ?? 20;
    this.dissolve = this.speed * 0.3;   // the 0.3 s visual dissolve at a flip, in metres of front travel
    this.frozen = auditFront();   // (the stage art: { from, to, front } or null)
    this.audit = this.frozen ? this.frozen.from : auditEra();
    this.mode = ctx.mode;
    this.layout = ctx.layout;
    this.planGroups = eraGroups(eraPieces(ctx.layout));   // (r_g for the props, before the Level exists)
    const V4 = (a = 0, b = 0, c = 0, d = 0) => new THREE.Vector4(a, b, c, d);
    const tint = [1, 2, 3].map((e) => { const t = E.tint?.[e] || [1, 1, 1, 0]; return V4(t[0], t[1], t[2], t[3]); });
    const remap = [0, 1, 2, 3].map((i) => { const r = (E.remap || [])[i]; return r ? V4(r.base, r.eras[0] ?? r.base, r.eras[1] ?? r.base, r.eras[2] ?? r.base) : V4(-1, -1, -1, -1); });
    const mur = Array.from({ length: 12 }, (_, i) => (E.murals && E.murals[i] !== undefined ? eraMask(E.murals[i]) : 7));
    this.uniforms = {
      uEra: { value: V4(1, 1, -1, this.dissolve) }, uEraW: { value: V4(1, 1, 0, 0) },
      uEraTint: { value: tint }, uEraRemap: { value: remap }, uMurEra: { value: mur },
      uEraColA: { value: new THREE.Color(E.colors?.appear || '#f4e9c8') }, uEraColV: { value: new THREE.Color(E.colors?.vanish || '#a9a49a') },
      uEraT: { value: 0 }, uEraFar: { value: V4(0, 0, 0, 0) },
    };
    this.era = 0; this.navEra = 0; this.envEra = 1; this.jumping = false;
    this.run = null; this.meshes = []; this.propMeshes = []; this.fx = null; this.mm = null; this.nav = null;
    // baseMs: every minimap base switch (a cached swap is ~0 ms); baseBuilds: the switches that had to BUILD a raster
    // ({ e, ms, why, t }: t = the stage time, null outside a match) — a build between J and done + 1 is the hitch
    this.stats = { navMs: 0, mergeMs: 0, navBuilds: [], paintMs: 0, meshMs: 0, levelMs: 0, baseMs: [], baseBuilds: [] };
    // era meshes sit out the GTAO override pass (it draws them without the collapse) while both eras' meshes are up: during
    // a jump every era mesh; during the warning only the coming era's, drawn collapsed (review 2, issue 2: the pieces still
    // in play keep their contact shading for the 10 s warning)
    this._aoGateFor = (mask) => (r, s, c, g) => { g.drawRange.count = s.overrideMaterial && (this.jumping || (this.warming && !hasEra(mask, this._restEra))) ? 0 : Infinity; };
    this.warming = false; this._restEra = 1;
  }

  // ---------------------------------------------------------------- build chain
  prop(it, kit) {
    if (!it.eras) return it;
    if (kit && !kit.tagMaterial) kit.tagMaterial = (key, tag, base) => (tag && tag[0] === 'e' ? eraMaterial(base, this.uniforms, 'aTag') : null);
    const mask = eraMask(it.eras), p = it.pos || [0, 0, 0];
    const g = it.eraGroup ? this.planGroups.get(groupKey(it.eraGroup, p[2], '')) : null;
    return { ...it, bucketTag: 'e' + mask, bucketVec: [mask, g ? g.rg : Math.hypot(p[0], p[2])] };
  }
  colliders(it, cols) { return it.eras ? cols.map((c) => ({ ...c, eras: it.eras, eraGroup: it.eraGroup })) : cols; }

  attachLevel(level) {
    const t0 = now();
    this.level = level;
    level.geomAttrs = [{ name: 'aEra', size: 2, value: (b) => [b.presence || 7, b.eraR || 0] }];
    // the stage's own level art (LAYOUT.levelArt / levelArtOf: Bluestone's facades, streets and cover per era, drawn under
    // the ink by the fragment's era — stages/bluestone/levelart.js): its per-block attribute rides beside aEra
    if (typeof this.layout?.levelArtOf === 'function') level.geomAttrs.push({ name: 'aArt', size: 2, value: this.layout.levelArtOf(this.layout) });
    level.eraCount = 3;
    const map = new Map();
    this.groups = []; this.eraIds = [];
    for (const b of level.blocks) {
      b.eraG = -1; b.eraR = 0;
      if (!b.presence) continue;
      this.eraIds.push(b.id);
      const key = groupKey(b.eraGroup, b.center.z, 'b' + b.id);
      let g = map.get(key);
      if (!g) map.set(key, (g = { key, i: this.groups.length, blocks: [], mask: 0, x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity, era: 0 })), this.groups.push(g);
      g.blocks.push(b.id); g.mask |= b.presence;
      g.x0 = Math.min(g.x0, b.aabbMin.x); g.x1 = Math.max(g.x1, b.aabbMax.x); g.z0 = Math.min(g.z0, b.aabbMin.z); g.z1 = Math.max(g.z1, b.aabbMax.z);
    }
    let rmax = 0;
    for (const g of this.groups) {
      g.cx = (g.x0 + g.x1) / 2; g.cz = (g.z0 + g.z1) / 2; g.rg = Math.hypot(g.cx, g.cz);
      for (const id of g.blocks) { level.blocks[id].eraG = g.i; level.blocks[id].eraR = g.rg; }
      rmax = Math.max(rmax, g.rg);
    }
    // R_max: the farthest face corner (or r_g) from (0, 0), plus 2 m; done = J + R_max / speed + 0.5
    for (const f of level.faces) for (const [a, c] of [[0, 0], [1, 0], [0, 1], [1, 1]]) rmax = Math.max(rmax, Math.hypot(f.origin.x + f.u.x * f.su * a + f.v.x * f.sv * c, f.origin.z + f.u.z * f.su * a + f.v.z * f.sv * c));
    this.reach = rmax + 2;
    this.doneOff = this.reach / this.speed + 0.5;
    this.stats.levelMs = now() - t0;
  }

  // per paint cell: the eras it is live in (cellPres: its face's eras minus the eras of any block burying its sample
  // point); for the cells an era piece touches, what to re-test at a flip (the face block, a shared block burying it,
  // the era blocks burying it); per group, its own faces' cells and the cells it buries
  attachPaint(P) {
    const t0 = now(), L = this.level, N = P.grid.length;
    this.paint = P;
    const pres = (this.cellPres = new Uint8Array(N)), turf = (this.cellTurf = new Uint8Array(N)), area = (this.cellArea = new Float32Array(N));
    const relOf = (this.relOf = new Int32Array(N).fill(-1));
    const rFace = [], rShared = [], rStart = [0], rIds = [];
    const own = this.groups.map(() => []), under = this.groups.map(() => []);
    const EB = this.eraIds.map((id) => L.blocks[id]), ids = [], p = _p;
    let rel = 0;
    for (const f of P.paintFaces) {
      const fb = L.blocks[f.block], fmask = fb.presence || 7;
      let near = !!fb.presence;
      if (!near) {
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity;
        for (const [a, c] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
          const x = f.origin.x + f.u.x * f.su * a + f.v.x * f.sv * c, y = f.origin.y + f.u.y * f.su * a + f.v.y * f.sv * c, z = f.origin.z + f.u.z * f.su * a + f.v.z * f.sv * c;
          x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
        }
        for (const b of EB) if (b.aabbMax.x > x0 - 0.1 && b.aabbMin.x < x1 + 0.1 && b.aabbMax.y > y0 - 0.1 && b.aabbMin.y < y1 + 0.1 && b.aabbMax.z > z0 - 0.1 && b.aabbMin.z < z1 + 0.1) { near = true; break; }
      }
      for (let j = 0; j < f.nv; j++) for (let i = 0; i < f.nu; i++) {
        const k = f.grid + j * f.nu + i;
        turf[k] = f.turf ? 1 : 0; area[k] = f.cu * f.cv;
        if (!near) { pres[k] = P.dead[k] ? 0 : 7; continue; }
        p.copy(f.origin).addScaledVector(f.u, (i + 0.5) * f.cu).addScaledVector(f.v, (j + 0.5) * f.cv).addScaledVector(f.n, 0.06);
        let buried = 0, shared = 0;
        const n0 = rIds.length;
        L.queryBlocks(p.x - 0.01, p.z - 0.01, p.x + 0.01, p.z + 0.01, ids);
        for (const id of ids) {
          if (id === f.block) continue;
          const b = L.blocks[id];
          if (b.dynamic || !L.pointInBlock(b, p, 0)) continue;
          if (b.presence) { buried |= b.presence; rIds.push(id); } else { buried = 7; shared = 1; }
        }
        pres[k] = fmask & ~buried & 7;
        relOf[k] = rel++; rFace.push(f.block); rShared.push(shared); rStart.push(rIds.length);
        if (fb.presence) own[fb.eraG].push(k);
        for (let q = n0; q < rIds.length; q++) { const g = L.blocks[rIds[q]].eraG, U = under[g]; if (U[U.length - 1] !== k) U.push(k); }
      }
    }
    this.rFace = Int32Array.from(rFace); this.rShared = Uint8Array.from(rShared); this.rStart = Int32Array.from(rStart); this.rIds = Int32Array.from(rIds);
    for (const g of this.groups) { g.own = Int32Array.from(own[g.i]); g.under = Int32Array.from(under[g.i]); }
    // the faces of each era block (clearFaces at the warning / done + 1 s)
    this.faceOf = new Map();
    for (const id of this.eraIds) this.faceOf.set(id, L.blocks[id].faces.filter((fid) => fid >= 0 && L.faces[fid].atlas));
    this.relCells = rel;
    this.stats.paintMs = now() - t0;
  }
  // the dead / live arrays and the turf bookkeeping for the whole world in era e (one pass, a few ms)
  _paintEra(e) {
    const P = this.paint;
    if (!P) return;
    const bit = eraBit(e), pres = this.cellPres, turf = this.cellTurf, A = this.cellArea, g = P.grid, dead = P.dead, live = P.live, N = g.length;
    let tt = 0, ta = 0, c0 = 0, c1 = 0;
    for (let k = 0; k < N; k++) {
      const d = pres[k] & bit ? 0 : 1, l = turf[k] && !d ? 1 : 0;
      dead[k] = d; live[k] = l;
      if (l) { tt++; ta += A[k]; const v = g[k]; if (v === 1) c0++; else if (v === 2) c1++; }
    }
    P.turfTotal = tt; P.turfArea = ta; P.counts[0] = c0; P.counts[1] = c1;
    P.version++;
  }
  // a dead array for era e (the minimap's other bases)
  _deadFor(e) { const bit = eraBit(e), pres = this.cellPres, out = new Uint8Array(pres.length); for (let k = 0; k < pres.length; k++) out[k] = pres[k] & bit ? 0 : 1; return out; }
  // a flipped group's cells, re-tested with the blocks as they stand now (the world mid-jump is part one era, part the next)
  _flipCells(g) {
    const P = this.paint;
    if (!P) return;
    const L = this.level, blocks = L.blocks, dead = P.dead, live = P.live, grid = P.grid, cnt = P.counts, turf = this.cellTurf, A = this.cellArea;
    const relOf = this.relOf, rFace = this.rFace, rShared = this.rShared, rStart = this.rStart, rIds = this.rIds;
    let changed = 0;
    for (const list of [g.own, g.under]) for (let i = 0; i < list.length; i++) {
      const k = list[i], r = relOf[k];
      let d = !blocks[rFace[r]].solid || rShared[r] === 1;
      for (let q = rStart[r]; !d && q < rStart[r + 1]; q++) if (blocks[rIds[q]].solid) d = true;
      const nd = d ? 1 : 0;
      if (dead[k] === nd) continue;
      dead[k] = nd;
      const nl = turf[k] && !nd ? 1 : 0;
      if (live[k] !== nl) {
        live[k] = nl;
        const s = nl ? 1 : -1, v = grid[k];
        P.turfTotal += s; P.turfArea += s * A[k];
        if (v) cnt[v - 1] += s;
      }
      changed++;
    }
    if (changed) P.version++;
    return changed;
  }

  levelMaterial({ grate }) {
    const ext = eraLevelExt(this.uniforms, grate), fn = this.layout?.levelArt;
    if (typeof fn !== 'function') return ext;
    // (after the era chunks: the art reads the fragment's era, eraOneHot; night: the environment's factor, read live)
    const night = { get value() { return G.env?.U?.uNight?.value || 0; }, set value(v) { /* the environment's */ } };
    const art = fn({ grate, night, lamps: [1, 2, 3].map((e) => this.E.look?.[e]?.lamps || '#ffe0b8') });
    return art ? [ext, art] : ext;
  }
  levelFilter() { return (b) => !b.grate && !b.presence; }   // the main mesh: shared blocks only

  afterMeshes(o) {
    const t0 = now(), { scene, level, size, levelMat, grateMat, props } = o;
    this.scene = scene;
    const masks = [...new Set(this.eraIds.map((id) => level.blocks[id].presence))].sort((a, b) => a - b);
    for (const m of masks) for (const [grate, mat] of [[false, levelMat], [true, grateMat]]) {
      if (!mat) continue;
      const geo = level.buildGeometry(size, (b) => !!b.grate === grate && b.presence === m);
      if (!geo.index || !geo.index.count) { geo.dispose(); continue; }
      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = `level:era${m}${grate ? ':grate' : ''}`; mesh.userData.eraMask = m;
      mesh.castShadow = !grate; mesh.receiveShadow = true;
      mesh.customDepthMaterial = eraDepthMaterial(this.uniforms, 'aEra');
      mesh.onBeforeRender = this._aoGateFor(m);
      scene.add(mesh); this.meshes.push(mesh);
    }
    for (const m of props?._meshes || []) {
      const tag = m.userData.tag;
      if (!tag || tag[0] !== 'e') continue;
      m.userData.eraMask = +tag.slice(1);
      m.customDepthMaterial = eraDepthMaterial(this.uniforms, 'aTag');
      m.onBeforeRender = this._aoGateFor(m.userData.eraMask);
      this.propMeshes.push(m);
    }
    this.fx = new EraFx(this, { scene, props });
    this.stats.meshMs = now() - t0;
  }

  // three NavGraphs (one per era's solidity) merged into one union graph with an era mask on every edge
  buildNav(level, physics) {
    const t0 = now(), graphs = [], ms = [];
    for (const e of [1, 2, 3]) { this._solidity(e); const t = now(); graphs.push(new NavGraph(level, physics)); ms.push(Math.round(now() - t)); }
    this._solidity(0);
    const tm = now();
    const nav = this._merge(graphs);
    this.stats.mergeMs = Math.round((now() - tm) * 10) / 10; this.stats.navBuilds = ms; this.stats.navMs = Math.round(now() - t0);
    this.nav = nav;
    return nav;
  }
  attachNav(nav) { this.nav = nav; }
  // the era blocks solid as in era e (0: all solid, the build state)
  _solidity(e) {
    const B = this.level.blocks;
    for (const id of this.eraIds) { const b = B[id], w = e ? hasEra(b.presence, e) : true; b.solid = w; b.absent = !w; }
  }
  _merge(graphs) {
    const g0 = graphs[0], U = Object.create(NavGraph.prototype);
    Object.assign(U, { level: g0.level, physics: g0.physics, step: g0.step, x0: g0.x0, z0: g0.z0, nx: g0.nx, nz: g0.nz, blocked: null, ext: null, edgeMask: 0,
      hScale: Math.min(...graphs.map((g) => g.hScale || 1)), nodes: [], cells: Array.from({ length: g0.nx * g0.nz }, () => []) });
    const maps = graphs.map((g) => new Int32Array(g.nodes.length));
    graphs.forEach((g, gi) => {
      const bit = 1 << gi;
      for (const n of g.nodes) {
        const cell = U.cells[n.iz * U.nx + n.ix];
        let id = -1, bd = 0.15;
        for (const u of cell) { const m = U.nodes[u]; if (m.em & bit) continue; const d = Math.abs(m.y - n.y); if (d < bd) { bd = d; id = u; } }
        if (id < 0) { id = U.nodes.length; U.nodes.push({ id, x: n.x, y: n.y, z: n.z, ix: n.ix, iz: n.iz, nb: [], zone: n.zone, em: 0, wet: 0, overWater: false, nudged: n.nudged }); cell.push(id); }
        U.nodes[id].em |= bit; maps[gi][n.id] = id;
      }
    });
    const NU = U.nodes.length;
    U.eraWet = graphs.map(() => new Uint8Array(NU)); U.eraOver = graphs.map(() => new Uint8Array(NU));
    U.eraValid = []; U.eraExit = []; U.eraValidIds = [];
    graphs.forEach((g, gi) => {
      const bit = 1 << gi, M = maps[gi], v = new Uint8Array(NU), x = new Uint8Array(NU);
      for (const n of g.nodes) {
        const u = M[n.id], un = U.nodes[u];
        U.eraWet[gi][u] = n.wet; U.eraOver[gi][u] = n.overWater ? 1 : 0;
        if (g.valid[n.id]) v[u] = 1;
        if (g.exitable[n.id]) x[u] = 1;
        for (const e of n.nb) {
          const to = M[e.to];
          let ex = null;
          for (const y of un.nb) if (y.to === to && y.type === e.type && Math.abs(y.cost - e.cost) < 1e-4) { ex = y; break; }
          if (ex) ex.em |= bit; else un.nb.push({ ...e, to, em: bit });
        }
      }
      U.eraValid.push(v); U.eraExit.push(x);
      const ids = []; for (let i = 0; i < NU; i++) if (v[i]) ids.push(i);
      U.eraValidIds.push(ids);
    });
    U.anyValid = new Uint8Array(NU); for (const v of U.eraValid) for (let i = 0; i < NU; i++) if (v[i]) U.anyValid[i] = 1;
    U.edgeProblems = graphs.flatMap((g) => g.edgeProblems || []);
    // the edge between two nodes in the era in force (bots read edges by their ends)
    U.edge = function (a, b) { const EM = this.edgeMask; for (const e of this.nodes[a].nb) if (e.to === b && (!EM || e.em === undefined || e.em & EM)) return e; return null; };
    U.edgeType = function (a, b) { const e = this.edge(a, b); return e ? e.type : 'walk'; };
    U.eraMaps = maps;
    U.valid = U.eraValid[0]; U.exitable = U.eraExit[0]; U.validIds = U.eraValidIds[0];
    return U;
  }
  _setNavEra(e) {
    const U = this.nav;
    if (!U || !U.eraValid) return;
    const i = e - 1;
    U.edgeMask = eraBit(e); U.valid = U.eraValid[i]; U.exitable = U.eraExit[i]; U.validIds = U.eraValidIds[i];
    const W = U.eraWet[i], O = U.eraOver[i];
    for (const n of U.nodes) { n.wet = W[n.id]; n.overWater = !!O[n.id]; }
    this.navEra = e;
  }

  attachMinimap(mm) {
    this.mm = mm;
    // The minimap drops every cached era base when the viewer's side flips (minimap.js setViewerTeam: they were drawn for
    // the other side) or the time of day changes. Built lazily, the next done would pay a whole raster (~0.1 s) in one
    // frame. A side flip comes only while a match loads (main.js, the screen faded out), so the other eras' bases are
    // rebuilt right there; StageEras.update rebuilds any still missing (the theme's drop) before the next jump.
    if (mm && typeof mm.setViewerTeam === 'function' && !Object.prototype.hasOwnProperty.call(mm, 'setViewerTeam')) {
      const own = mm.setViewerTeam;
      mm.setViewerTeam = (team) => { own.call(mm, team); if (G.eraWorld === this && this.mm === mm) this._ensureBases('side'); };
    }
  }
  mapBlock(b) { return !b.absent; }
  _present(e) { const bit = eraBit(e); return (b) => !b.dynamic && (b.presence ? (b.presence & bit) !== 0 : b.solid); }
  _hasBase(e) { const mm = this.mm; return !!mm && ((mm._bases && mm._bases.has(e)) || (mm.baseKey === e && mm._built)); }
  _mapEra(e, why = 'swap') {
    const mm = this.mm;
    if (!mm || !mm.setBase) return;
    const built = !this._hasBase(e), t = now();
    mm.setBase(e, this._present(e));
    const ms = Math.round(now() - t);
    this.stats.baseMs.push(ms);
    if (built) this._logBuild(e, ms, why);
  }
  _logBuild(e, ms, why) { const R = this.run; this.stats.baseBuilds.push({ e, ms, why, t: R ? +R.tNow.toFixed(3) : null }); if (this.stats.baseBuilds.length > 400) this.stats.baseBuilds.shift(); }
  // is an era's base missing from the minimap's cache (dropped by a side flip or a theme change)?
  _basesMissing() {
    const mm = this.mm;
    if (!mm || !mm.setBase || !this.paint || !mm._built || mm.baseKey === undefined) return false;
    for (const e of [1, 2, 3]) if (!this._hasBase(e)) return true;
    return false;
  }
  // build the era bases the cache lacks now (at most `max` of them; the one on show stays: the minimap drew it for this
  // side and theme), each with that era's dead cells; setBase caches them, so the done's swap is free. Returns how many
  // it built.
  _ensureBases(why = 'idle', max = 3) {
    const mm = this.mm, P = this.paint;
    if (!mm || !P || !mm.setBase || !mm._built) return 0;
    const cur = mm.baseKey ?? this.era;
    let n = 0;
    for (const e of [1, 2, 3]) {
      if (n >= max) break;
      if (e === cur || this._hasBase(e)) continue;
      const t = now(), save = P.dead; P.dead = this._deadFor(e);
      try { mm.setBase(e, this._present(e)); } finally { P.dead = save; }
      this._logBuild(e, Math.round(now() - t), why);
      n++;
    }
    if (n) mm.setBase(cur, this._present(cur));   // back to the base on show (cached by the first switch away)
    return n;
  }
  // the other eras' minimap bases, built in idle time after the world build (ready)
  _prebuildBases() { return this._ensureBases('load'); }
  // A match set up on a world kept from the last one, at another time of day: the minimap would drop its cached bases in
  // the match's first HUD frame (minimap.js update: a theme other than the one it drew) and the next frames would rebuild
  // them during the intro. Let it take the new theme now, while the match is set up behind the faded screen, and build
  // the bases here.
  _syncTheme() {
    const mm = this.mm, th = G.game?.theme || G.game?.mapDef?.theme || 'day';
    if (!mm || typeof mm.update !== 'function' || !mm._theme || mm._theme === th) return 0;
    mm.update(0);
    return this._ensureBases('theme');
  }

  attachEnv(env) {
    this.env = env;
    env.themeOverlay = (name) => this._overlay(name);
    for (const e of [1, 2, 3]) { const g = env.stageSets?.[e]; if (g) { patchSetClip(g, this.uniforms, eraBit(e)); g.visible = e === this.envEra; } }
  }
  _overlay(name, era = this.envEra) {
    const L = this.E.look?.[era];
    if (!L || !L.theme) return null;
    return { ...(L.theme.all || {}), ...(L.theme[name] || {}) };
  }
  _sets(e) { const S = this.env?.stageSets; if (S) for (const k of [1, 2, 3]) if (S[k]) S[k].visible = k === e; }
  // ENGINE rule 42 (the art phase): the lamps' light per era — eras.look[e].lamps on the decor's lamp glass (its bodies are
  // the eras' own props on the same spots: a gas lamp, a street light, a light mast; the decor's iron body is hidden),
  // blended from the old era's to the new one's through the time-lapse (k 0 … 1)
  _lamps(e, from = e, k = 1) {
    const d = G.game?.decor;
    if (!d || !d.bulbMat || G.level !== this.level) return;
    if (!this._lampHid || this._lampHid !== d) { d.group?.traverse?.((o) => { if (o.name === 'lamps:body') o.visible = false; }); this._lampHid = d; }
    const L = this.E.look || {}, a = L[from]?.lamps || '#ffd9a0', b = L[e]?.lamps || '#ffd9a0';
    d.bulbMat.emissive.set(a);
    if (k > 0) d.bulbMat.emissive.lerp(_c.set(b), Math.min(1, k));
    this.stats.lampEra = k >= 1 ? e : from;
  }
  _envEra(e, apply = true) {
    if (this.envEra === e && !apply) return;
    const changed = this.envEra !== e;
    this.envEra = e;
    this._lamps(e);
    this._sets(e);
    this.uniforms.uEraFar.value.w = 0;
    if (apply && changed && this.env?.setTheme && this.env.theme) { const t = now(); this.env.setTheme(this.env.theme); this.stats.setThemeMs = Math.round(now() - t); }
  }

  ready() {
    this.apply(this.audit || 1, { why: 'start' });
    const idle = typeof requestIdleCallback === 'function' ? (fn) => requestIdleCallback(fn, { timeout: 2500 }) : (fn) => setTimeout(fn, 200);
    this._warmed = false;
    idle(() => { if (G.eraWorld === this && !this._warmed) this.warm(); });
  }
  // [b5-beta1] the other eras' minimap bases and every era program, now: at a match's load (StageWorld.warm, the screen
  // faded out) or in idle time after a menu backdrop's build, whichever comes first — never in the intro (the idle job
  // above ran ~0.8 s into a Bluestone match's intro when the match built the world: a 0.1–2 s hitch on screen)
  warm() { if (this.jumping) return; this._prebuildBases(); if (!this._warmed) { this._warmed = true; this._precompile(); } }

  // every era material's program (and its shadow depth program) compiled now, at load, not when a piece first shows
  // mid-jump: each era mesh shown once, collapsed, for a compile pass
  _precompile() {
    const r = G.renderer, sc = G.scene, cam = G.camera;
    if (!r || !sc || !cam || !r.compile) return;
    // (review 2, issue 1: the kiosks' bell sprites and the holograms' stand-ins too — their programs were first used on the
    //  warning's frame — and the backdrop's era sets, which first show in the horizon run; every one drawn empty or off
    //  screen: the sprites at opacity 0, the stand-ins 40 m under the stage, the sets as they are)
    const fx = [];
    this.fx?.group.traverse((o) => { if (o !== this.fx.group) fx.push(o); });
    if (this.fx?.curtain) { this.fx.curtain.material.uniforms.uA.value = 0; this.fx.curtain.scale.set(0.01, 0.01, 0.01); }
    const sprites = fx.filter((o) => o.isSprite), op = sprites.map((o) => o.material.opacity);
    for (const o of sprites) o.material.opacity = 0;
    const sets = Object.values(this.env?.stageSets || {}).filter(Boolean);
    const t = now(), ms = [...this.meshes, ...this.propMeshes, ...fx, ...sets], was = ms.map((m) => m.visible);
    for (const m of ms) m.visible = true;
    const p0 = r.info?.programs?.length || 0;
    // a real frame (the game's own post stack: the exact program variants, the shadow depth and the GTAO passes), every
    // era mesh up but collapsed by the shader (uEra holds the world's era: a piece of another era draws nothing)
    try { if (G.game?.R?.render) G.game.R.render(); else r.compile(sc, cam); } catch (e) { /* (a headless page) */ }
    ms.forEach((m, i) => { m.visible = was[i]; });
    sprites.forEach((o, i) => { o.material.opacity = op[i]; });
    // the paint atlas's clearing quad (paint.clearFaces: first used at the warning, when the appearing pieces are cleared):
    // its program compiled now, on one face of a piece absent in the era shown (blank: it can take no ink here)
    const P = this.paint, B = this.level?.blocks;
    if (P && B && this.faceOf) for (const id of this.eraIds) { if (hasEra(B[id].presence, this.era || 1)) continue; const fs = this.faceOf.get(id); if (fs && fs.length) { P.clearFaces([fs[0]]); break; } }
    this.stats.compileMs = Math.round(now() - t); this.stats.compiled = (r.info?.programs?.length || 0) - p0; this.stats.precompiled = (this.stats.precompiled || 0) + 1;
  }
  // ---------------------------------------------------------------- switches
  // one group to era e now: its blocks solid or not (returns the block ids that came / went)
  _setGroup(g, e) {
    const on = [], off = [], B = this.level.blocks;
    for (const id of g.blocks) { const b = B[id], w = hasEra(b.presence, e); if (b.solid !== w || b.absent === undefined) { if (b.solid !== w) (w ? on : off).push(id); b.solid = w; b.absent = !w; } }
    g.era = e;
    return { on, off };
  }
  // the whole world in era e at once (no animation): blocks, paint, nav, looks, minimap, environment
  apply(e, { why = 'debug', theme = why !== 'start' } = {}) {
    for (const g of this.groups) this._setGroup(g, e);
    this._paintEra(e);
    this._setNavEra(e);
    this.era = e;
    this.jumping = false;
    this.looks(e, e, -1, 0, 0);
    this._mapEra(e);
    this._envEra(e, theme);
    this.lastApply = why;
  }
  // the looks for a moment: uEra, the meshes shown (both eras during a jump), the warning flicker and the done pulse
  looks(from, to, front, warnK, pulseK, nextFrom = from, nextTo = to) {
    const U = this.uniforms;
    U.uEra.value.set(eraBit(from), eraBit(to), front, this.dissolve);
    U.uEraW.value.set(eraBit(nextFrom), eraBit(nextTo), warnK, pulseK);
    // (in the warning the coming era's meshes are already up, collapsed by the shader: no program is first used mid-jump)
    this.warming = warnK > 0 && front < 0; this._restEra = from;
    const vis = (m) => hasEra(m, from) || (front >= 0 && hasEra(m, to)) || (this.warming && hasEra(m, nextTo));
    for (const m of this.meshes) m.visible = vis(m.userData.eraMask);
    for (const m of this.propMeshes) m.visible = vis(m.userData.eraMask);
  }
  // is this block in play at the painter's stage time (and outside its flip's guard)? — the paint block gate (H5)
  inkOk(b, et) {
    if (!b.presence) return true;
    return this.run ? this.run.inkOk(b, et) : !b.absent;
  }
  present(b, t) { return !b.presence || (this.run ? this.run.present(b, t) : !b.absent); }
  now() { return G.match?.stage?.clock?.t ?? 0; }

  bakePasses() { return [() => this.apply(1, { why: 'bake' }), () => this.apply(2, { why: 'bake' }), () => this.apply(3, { why: 'bake' })]; }
  bakeMode(on) { if (!on) this.apply(this.audit || 1, { why: 'bake' }); }

  dispose() {
    if (this.mm && Object.prototype.hasOwnProperty.call(this.mm, 'setViewerTeam')) delete this.mm.setViewerTeam;
    for (const m of this.meshes) { this.scene?.remove(m); m.geometry.dispose(); }
    this.meshes = []; this.propMeshes = [];
    this.fx?.dispose(); this.fx = null;
    if (this.env && this.env.themeOverlay) this.env.themeOverlay = null;
  }
}

// ================================================================================================== the match runtime
export class StageEras {
  static create(m, W, S) { return W && W.groups && W.groups.length ? new StageEras(m, W, S) : null; }

  constructor(m, W, S) {
    this.m = m; this.W = W; this.S = S;
    W.run = this;
    this.sched = eraSchedule(W.E, { mode: m.mode, duration: m.duration, practice: m.practice, attract: m.attract, audit: W.audit });
    this.over = null;   // debugJump's schedule (tests and audits only)
    this.stats = { eraShoves: 0, rescues: 0, flips: 0, devices: 0, frameMax: 0, flipLog: [],
      // the bots through the jumps (H16; botReport() sums them for the botlab's match.cjs): at each flip, own squidkids
      // standing on a top that went / inside a piece that came; bot-seconds inside an appearing piece's box from the
      // warning to its flip (4 Hz); splats from the warning to done + 2 s that no weapon dealt (water, a fall); bots
      // replanned at done; pre-positioned (H16b); per done, each bot's time to first stand on ground new in that era
      bots: { onVanish: 0, inAppear: 0, onVanishWho: [], loiterS: 0, loiterWho: {}, envSplats: 0, envSplatWho: [], replans: 0, prepos: 0, preposHeld: 0, visits: [] } };
    this._splatOff = on('splatted', (e) => this._onSplat(e));
    this._jcache = new Map(); this._cyc = null;
    this.phase = 'idle'; this.cur = null; this.fresh = null; this._freshUntil = -1; this._pulseAt = -99;
    this.lastT = S.clock.t;
    // The runtime never runs backwards between seeks. A follower's stage clock eases toward the host's (stageKit
    // StageClock: t += dt + d·min(1, 3dt)), so a host packet more than 1/3 s behind (a stall, then a burst) walks it back
    // for a few frames: flips and events follow the high-water mark _tHigh, and each (jump, event) fires once (_fired).
    // A real snap (> 1 s) goes through seek(), which re-derives everything at the new time and resets both.
    this._tHigh = S.clock.t; this._fired = new Map();
    // the starting era, before Zone Control / Tower Command / Boss Battle are built (BossNav sees era 2)
    const st = this.sched.start;
    if (W.era !== st || W.groups.some((g) => g.era !== st)) W.apply(st, { why: 'start', theme: true });
    else { W._setNavEra(st); W.looks(st, st, -1, 0, 0); }
    if (!m.attract) W._syncTheme();
    this.chip = m.attract ? null : new EraHud(this);   // (not `hud`: R.hud is a registry hook name)
    if (W.frozen && !m.attract) this.freeze(W.frozen);
    W._lamps(W.envEra);
    emit('era:set', { era: st, instant: true, why: 'start' });
  }
  get plan() { return this.over || this.sched; }
  // the runtime's time: the stage clock, never below what the world already shows (see _tHigh)
  get tNow() { const t = this.S.clock.t; return t > this._tHigh ? t : this._tHigh; }
  get era() { return this.eraInForce(this.tNow); }
  get front() { const J = this.cur; return J && this.phase === 'jump' ? (this.tNow - J.at) * this.W.speed : -1; }

  // ---------------------------------------------------------------- the clock (pure functions of t)
  jumps(t) {
    const P = this.plan;
    if (!P.cycle) return P.jumps;
    if (!this._cyc || this._cyc.P !== P || t + 30 > this._cyc.until) this._cyc = { P, until: t + 120, list: cycleJumps(P.cycle, t, 120) };
    return this._cyc.list;
  }
  // a jump's derived data (cached per from → to): times, the blocks / groups that change, outlines, faces to clear
  _info(j) {
    const W = this.W, k = j.from * 10 + j.to;
    let c = this._jcache.get(k);
    if (!c) {
      const L = W.level, appear = [], vanish = [], groups = [];
      for (const g of W.groups) {
        let ch = false;
        for (const id of g.blocks) { const b = L.blocks[id], a = hasEra(b.presence, j.from), z = hasEra(b.presence, j.to); if (a !== z) { ch = true; (z ? appear : vanish).push(id); } }
        if (ch) groups.push(g.i);
      }
      const box = (id, ap) => {
        const b = L.blocks[id], tilted = Math.abs(b.axes[1].y) < 0.999;
        if (tilted) return { id, x: (b.aabbMin.x + b.aabbMax.x) / 2, z: (b.aabbMin.z + b.aabbMax.z) / 2, hx: (b.aabbMax.x - b.aabbMin.x) / 2, hz: (b.aabbMax.z - b.aabbMin.z) / 2, yaw: 0, y0: b.aabbMin.y, y1: b.aabbMax.y, appear: ap };
        return { id, x: b.center.x, z: b.center.z, hx: b.half.x, hz: b.half.z, yaw: Math.atan2(-b.axes[0].z, b.axes[0].x), y0: b.aabbMin.y, y1: b.aabbMax.y, appear: ap };
      };
      const faces = (ids) => ids.flatMap((id) => W.faceOf?.get(id) || []);
      const fresh = W.nav?.eraValid ? (() => { const a = W.nav.eraValid[j.to - 1], b = W.nav.eraValid[j.from - 1], f = new Uint8Array(a.length); for (let i = 0; i < a.length; i++) f[i] = a[i] && !b[i] ? 1 : 0; return f; })() : null;
      c = { appear, vanish, groups, outlines: [...appear.map((id) => box(id, true)), ...vanish.map((id) => box(id, false))], appearFaces: faces(appear), vanishFaces: faces(vanish), fresh };
      this._jcache.set(k, c);
    }
    if (this._last && this._last.src === j && this._last.c === c) return this._last.v;
    const v = { ...c, from: j.from, to: j.to, at: j.at, prebellAt: j.at - W.prebell, warnAt: j.at - W.warn, doneAt: j.at + W.doneOff, clearAt: j.at + W.doneOff + 1 };
    this._last = { src: j, c, v };
    return v;
  }
  // the era in force at radius r at time t (the front's side)
  eraAt(r, t, list = this.jumps(t)) {
    let e = this.plan.start;
    const sp = this.W.speed;
    for (const j of list) { if (t >= j.at + r / sp) e = j.to; else break; }
    return e;
  }
  eraInForce(t, list = this.jumps(t)) { let e = this.plan.start; for (const j of list) { if (t >= j.at + this.W.doneOff) e = j.to; else break; } return e; }
  eraAtPoint(x, z) { return this.eraAt(Math.hypot(x, z), this.tNow); }
  // the jump whose pre-bell … clear window holds t
  activeAt(t, list = this.jumps(t)) { for (const j of list) { if (t >= j.at - this.W.prebell && t < j.at + this.W.doneOff + 1) return j; if (j.at - this.W.prebell > t) break; } return null; }
  nextAt(t, list = this.jumps(t)) { for (const j of list) if (t < j.at + this.W.doneOff) return j; return null; }
  get next() { const t = this.tNow, j = this.nextAt(t); return j ? { from: j.from, to: j.to, at: j.at, inS: Math.max(0, j.at - t) } : null; }
  present(b, t) { const g = this.W.groups[b.eraG]; return !g || hasEra(b.presence, this.eraAt(g.rg, t)); }
  // the ink guard (exact across screens: the painter's own clock rides a replayed splat, opts.et)
  inkOk(b, et) {
    const W = this.W, g = W.groups[b.eraG];
    if (!g) return !b.absent;
    const list = this.jumps(et);
    if (!hasEra(b.presence, this.eraAt(g.rg, et, list))) return false;
    for (const j of list) {
      const ft = j.at + g.rg / W.speed;
      if (ft - W.guard > et) break;
      if (Math.abs(et - ft) < W.guard && hasEra(b.presence, j.from) !== hasEra(b.presence, j.to)) return false;
    }
    return true;
  }
  near(t) { for (const j of this.jumps(t)) { if (t >= j.at - 1 && t <= j.at + this.W.doneOff + 1) return true; if (j.at - 1 > t) break; } return false; }
  splatTime(c, r) { const t = this.S.clock.t; return this.near(t) ? +t.toFixed(3) : undefined; }

  // ---------------------------------------------------------------- per frame
  update(dt, clockT) {
    const W = this.W, f0 = now();
    // (a clock easing back a little holds the world where it is: monotonic between seeks)
    const t = clockT > this._tHigh ? clockT : this._tHigh;
    this._tHigh = t;
    if (this._frz) { this._frozenView(); return; }
    // (the art phase, DESIGN §3.5) Tartar rings once in the intro fly-in, as the camera sweeps past the dome toward the
    // spawn: the sound every jump starts with, taught before the first one (the ring's look runs on the intro's own clock)
    if (this.m.state === 'intro' && !this.m.attract && !this._introRung && this.m.stateT >= 0.7) {
      this._introRung = true; this._ring(null, 'intro'); this._ringAt = undefined; this._introRingAt = this.m.stateT;
      this.stats.introRing = 1;
    }
    const list = this.jumps(t);
    // every group to its era at this moment (a pure function of the clock): the front flips each when it reaches r_g
    for (const g of W.groups) { const e = this.eraAt(g.rg, t, list); if (g.era !== e) this._flip(g, e, t); }
    // for 2.5 s after a piece went: a remote rider's Zipline tether on it ends (its owner's late record can re-hang it)
    const RO = this._recentOff;
    if (RO && RO.length) { while (RO.length && (t - RO[0].t > 2.5 || RO[0].t > t + 0.5)) RO.shift(); for (const f of RO) this._zips(f.ids, true); }
    // events whose time passed this frame (a clock snap goes through seek instead)
    if (t > this.lastT && t - this.lastT < 1.0) this._events(this.lastT, t, list);
    this.lastT = t;
    this._view(t, list);
    if (this.cur || this._visit) this._botTick(t, this.cur);
    // a minimap base still missing (a drop the load did not see: the time of day changed mid-match) is rebuilt outside a
    // jump, one per frame (~0.1 s each): from J to done only cached bases are swapped
    if (this.phase !== 'jump' && W._basesMissing()) W._ensureBases(this.m.state === 'playing' ? this.phase : this.m.state, 1);
    const ms = now() - f0;
    if (ms > this.stats.frameMax) this.stats.frameMax = ms;
  }
  seek(t, why = 'clock') {
    const W = this.W, list = this.jumps(t), was = this._tHigh;
    this._tHigh = t;
    if (this._frz) { this.freeze(this._frz); return; }
    for (const [k, at] of this._fired) if (at > t) this._fired.delete(k);   // (what lies ahead again may fire again)
    for (const g of W.groups) { const e = this.eraAt(g.rg, t, list); if (g.era !== e) this._flip(g, e, t); }
    const e = this.eraInForce(t, list);
    const A = this.activeAt(t, list);
    if (A && t >= A.warnAt && t < A.at + W.doneOff) this._warnState(this._info(A)); else this._release();
    if (W.navEra !== e) { W._setNavEra(e); this._replan(null); }
    if (!(A && t >= A.at && t < A.at + W.doneOff)) W._mapEra(e);
    W._envEra(e, true);
    this.lastT = t;
    this._view(t, list);
    emit('era:set', { era: e, instant: true, why });
    // a follower's clock snapping FORWARD across a done (a stalled screen catching up, within a match): the done still
    // happens on this screen — era:done (Bazookarp's field switches on it), the fresh-ground weight, the pulse; the
    // callout only if the done is still fresh (≤ 2 s ago). A late joiner's seek ('late') or a test's jump does not
    if (why === 'clock' && t > was) {
      let last = null;
      for (const j of list) { const d = j.at + W.doneOff; if (d > was && d <= t) last = j; if (j.at > t) break; }
      if (last) {
        const J = this._info(last), key = `${J.from}>${J.to}@${J.at}:done:${J.at + W.doneOff}`;
        if (!this._fired.has(key)) {
          this._fired.set(key, J.at + W.doneOff);
          this.fresh = J.fresh; this._freshUntil = J.at + W.doneOff + 30; this._pulseAt = J.at + W.doneOff;
          if (t - this._pulseAt < 4) W.fx?.setOpened?.(J);
          if (t - (J.at + W.doneOff) <= 2) { const N = W.names; this._say(J.to < J.from ? `BACK TO THE ${N[J.to - 1]}` : J.to === 2 ? 'NEW ROUTES OPEN' : 'NEW AREAS!', N[J.to - 1], false); }
          this.stats.snapDones = (this.stats.snapDones || 0) + 1;
          emit('era:done', { era: J.to, snapped: true });
        }
      }
    }
  }
  _events(t0, t1, list) {
    for (const j of list) {
      if (j.at - this.W.prebell > t1) break;
      const J = this._info(j), D = this.W.doneOff;
      const ev = [[J.prebellAt, 'prebell'], [J.warnAt, 'warn'], [J.at - 8, 'prepos'], [J.at - 6, 'prepos'], [J.at - 4, 'prepos'], [J.at - 3, 'prepos'], [J.at - 2, 'prepos'], [J.at - 1.5, 'prepos'], [J.at - 1, 'prepos'], [J.at - 0.5, 'prepos'], [J.at - 5, 'ring'], [J.at - 3, 'short'], [J.at - 2, 'short'], [J.at - 1, 'pickup'], [J.at, 'jump'], [J.at + D, 'done'], [J.at + D + 0.7, 'env'], [J.at + D + 1, 'clear']];
      for (const [at, name] of ev) {
        if (!(t0 < at && at <= t1)) continue;
        const key = `${J.from}>${J.to}@${J.at}:${name}:${at}`;   // (each (jump, event) once: 'short' fires at two times)
        if (this._fired.has(key)) continue;
        this._fired.set(key, at);
        this._fire(name, J, t1);
      }
    }
    if (this._fired.size > 200) for (const [k, at] of this._fired) if (at < t1 - 300) this._fired.delete(k);
  }
  // the era's callouts: the module's own (EraHud.say: white-gold on dark, a both-teams event, never the viewer's team-ink
  // ribbon of the HUD's callouts, and never clearing a gameplay callout already on screen)
  _say(text, sub, big) { this.chip?.say(text, sub, big); }
  _snd(name, o = {}) { if (!this.m.attract) G.audio?.play?.(name, o); }
  _fire(name, J, t) {
    const W = this.W, N = W.names, T = new THREE.Vector3(0, 6.6, 0);
    const base = { from: J.from, to: J.to, at: J.at };
    switch (name) {
      case 'prebell':
        emit('era:prebell', { ...base, inS: W.prebell });
        this._snd('era_bell', { pos: T, volume: 0.8 });
        // (one distant ring that also shows: Tartar's phone gives a single shake and the kiosks' bells flash once — the
        //  clock rows start counting down from here, EraFx, and the chip shows "TODAY in 20")
        this._ringAt = this.tNow; this._ringLen = 0.9;
        emit('era:ring', { n: 'prebell', pos: [0, 6.6, 0] });
        if (W.fx) W.fx.stats.rings++;
        break;
      case 'warn':
        emit('era:warn', { ...base, inS: W.warn, names: N });
        this._say('TIME JUMP', `${N[J.from - 1]} → ${N[J.to - 1]} in ${W.warn}`, false);
        this._ring(J, 'warn');
        this._warnState(J);
        break;
      case 'prepos': this._prepos(J); break;
      case 'ring': this._ring(J, 2); break;
      case 'short': this._ring(J, 'short'); break;
      case 'pickup': {
        emit('era:ring', { n: 'pickup', pos: [0, 6.6, 0] });
        this._snd('era_pickup', { pos: T });
        const rewind = J.to < J.from;
        this._say(rewind ? 'Back to the beginning. Again.' : J.to === 2 ? 'Advancing the clock. Do keep up.' : 'Further. I must see how it ends.', 'COMMANDER TARTAR', false);
        this._pick = t;
        break;
      }
      case 'jump':
        emit('era:jump', { ...base, t0: J.at, speed: W.speed, origin: [0, 0], reach: W.reach });
        this._say(N[J.to - 1], J.to < J.from ? 'THE CLOCK RUNS BACK' : 'TIME JUMP', true);
        this._snd('era_swell', { volume: 1 });
        if (G.camera) emit('shake', { pos: G.camera.position.clone(), amount: 0.25 });
        if (!this.m.attract && G.audio?.loop && !this._fz) this._fz = G.audio.loop('era_front', { volume: 0 });
        W.jumping = true;
        break;
      case 'done': {
        W.jumping = false;
        W._setNavEra(J.to);
        this._release();
        this.stats.bots.replans += this._replan(J.to);
        W._mapEra(J.to);
        this.fresh = J.fresh; this._freshUntil = t + 30; this._pulseAt = t;
        W.fx?.setOpened?.(J);
        this._visitStart(J, t);
        const rewind = J.to < J.from;
        this._say(rewind ? `BACK TO THE ${N[J.to - 1]}` : J.to === 2 ? 'NEW ROUTES OPEN' : 'NEW AREAS!', N[J.to - 1], false);
        if (this._fz) { this._fz.stop(0.3); this._fz = null; }
        emit('era:done', { era: J.to });
        break;
      }
      case 'env': W._envEra(J.to, false); this._envFinal(J); break;
      case 'clear':
        // what vanished goes blank (all late replays have landed): a rewind brings it back clean
        if (J.vanishFaces.length && W.paint) W.paint.clearFaces(J.vanishFaces);
        W.fx?.setJump(null);
        break;
    }
  }
  _ring(J, n) {
    this._ringAt = this.tNow; this._ringLen = n === 'short' ? 0.4 : 1.6;
    emit('era:ring', { n, pos: [0, 6.6, 0] });
    this._snd('era_ring', { pos: new THREE.Vector3(0, 6.6, 0), volume: 1, n: n === 'short' ? 'short' : 'long' });
    // (the two kiosks nearest the camera ring aloud; the rest are too far to hear over Tartar)
    if (n !== 'short' && G.camera) { const cam = G.camera.position; for (const p of [...(this.W.fx?.phones || [])].sort((a, b) => a.pos.distanceToSquared(cam) - b.pos.distanceToSquared(cam)).slice(0, 2)) this._snd('era_kiosk', { pos: p.pos, volume: 0.8 }); }
    if (this.W.fx) this.W.fx.stats.rings++;
  }
  // the warning's state: appearing faces cleared (they arrive blank), the bots' danger layer, the holograms
  _warnState(J) {
    if (this._warned === J.at) return;
    this._warned = J.at;
    const W = this.W;
    if (J.appearFaces.length && W.paint) W.paint.clearFaces(J.appearFaces);
    W.fx?.setJump(J);
    // the danger layer: routes pay to enter a piece about to change, goals skip it; bots standing on one leave
    // (this.noDanger: the control run of tests/eras-bots.js only)
    const L = this.noDanger ? null : navClaim('eras');
    if (L) {
      for (const o of J.outlines) for (const id of navNodesInBox(o.x, o.z, o.yaw, o.hx, o.hz, 0.6, o.y0 - 1.0, o.y1 + 0.3)) L[id] = 1;
      navCommit(this.m.actors);
      this._layer = L;
      for (const a of this.m.actors) {
        if (!a.bot || a.remote) continue;
        const id = G.nav.nearest(a.pos, 1.2, true);
        if (id >= 0 && L[id]) { a.bot.goal = -1; a.bot.path = null; a.bot.repath = 0; }
      }
    }
  }
  _release() { if (this._layer) { navRelease('eras'); this._layer = null; } }
  // bots whose route runs an edge gone in the new era plan again (returns how many)
  _replan(e) {
    const nav = G.nav;
    let n = 0;
    for (const a of this.m.actors) {
      const b = a.bot;
      if (!b || !b.path) continue;
      if (e === null) { b.path = null; b.repath = 0; n++; continue; }
      for (let i = Math.max(1, b.pi | 0); i < b.path.length; i++) if (!nav.edge(b.path[i - 1], b.path[i])) { b.path = null; b.repath = 0; n++; break; }
    }
    return n;
  }

  // ---------------------------------------------------------------- bots (H16, H16b), from what every player sees
  // H16b (optional; ENGINE §4.3, DESIGN §3.9): pre-position. From J − 8 (looked at again at J − 6 … J − 1) of a jump that
  // OPENS ground (a gate vanishes), an own bot in paint mode (no foe, no Zone Control / Tower Command role) within 14 m of
  // the gate whose route to its goal in the coming era (nav.path with that era's edge mask) runs through ground that only
  // exists after the jump, takes that route and waits 3–6 m short of the gate, outside the danger layer — but only when
  // going through is no slower than the detour it would walk now, give or take the rush (RUSH s: the first through the
  // opening gets its blank turf): arrival through the gate = max(now + walk to the hold, the gate group's flip) + the rest
  // of the new route, against now + the old route, at run speed. It walks on at the gate's own flip (the piece is gone:
  // collision first, the nav catches up at done, and the done's replan keeps the route: every edge of it is the new era's).
  // It uses only the schedule and the outlines the HUD and the minimap show everyone. On the Z the gates save a few metres
  // (Degrayling Lane over the GPO terrace's hop), so a bot waits only in the last second or so before the flip.
  _prepos(J) {
    const nav = G.nav;
    if (!nav?.eraValid || !J.vanish.length || this.m.attract || this.noPrepos) return;   // (noPrepos: the tests' control run)
    const W = this.W, Vf = nav.eraValid[J.from - 1], tb = eraBit(J.to), N = nav.nodes, v = PLAYER.runSpeed, now = this.tNow, RUSH = 1.5;
    const len = (p, a = 0, b = p.length - 1) => { let d = 0; for (let i = a + 1; i <= b; i++) { const u = N[p[i - 1]], q = N[p[i]]; d += Math.hypot(u.x - q.x, u.z - q.z, u.y - q.y); } return d; };
    const L = W.level;
    for (const a of this.m.actors) {
      const b = a.bot;
      if (!b || a.remote || !a.alive || b._eraHold || b.mode !== 'paint' || b.target || b.zRole || b.tRole || !b.path || !(b.goal >= 0)) continue;
      const s = nav.nearest(a.pos, 1.2, true);
      if (s < 0) continue;
      const em = nav.edgeMask, bl = nav.blocked;
      let nxt = null;
      nav.edgeMask = tb; nav.blocked = null;
      try { nxt = nav.path(s, b.goal, a.team); } finally { nav.edgeMask = em; nav.blocked = bl; }
      if (!nxt) continue;
      const gi = nxt.findIndex((id) => !Vf[id]);   // the first node that only exists after the jump: the gate
      if (gi < 1) continue;
      const gn = N[nxt[gi]];
      if (Math.hypot(a.pos.x - gn.x, a.pos.z - gn.z) > 14) continue;   // (only a bot already by the gate waits for it)
      let hi = -1;
      for (let k = gi - 1; k >= 0; k--) {
        const n = N[nxt[k]], d = Math.hypot(n.x - gn.x, n.z - gn.z);
        if (d > 6) break;
        if (d >= 3 && !(this._layer && this._layer[nxt[k]])) { hi = k; break; }
      }
      if (hi < 0) continue;
      // the gate's group: the vanishing block whose footprint holds the gate node (its flip opens the way)
      let flip = J.at + W.doneOff;
      for (const id of J.vanish) { const bk = L.blocks[id]; if (gn.x > bk.aabbMin.x - 0.7 && gn.x < bk.aabbMax.x + 0.7 && gn.z > bk.aabbMin.z - 0.7 && gn.z < bk.aabbMax.z + 0.7) { flip = Math.min(flip, J.at + W.groups[bk.eraG].rg / W.speed); } }
      const cur = nav.path(s, b.goal, a.team);
      const tDetour = cur ? len(cur) / v : Infinity, tGate = Math.max(len(nxt, 0, hi) / v, flip + 0.1 - now) + len(nxt, hi) / v;
      if (tGate > tDetour + RUSH) continue;
      b.path = nxt; b.pi = Math.min(1, nxt.length - 1); b.bestD = Infinity; b.noProg = 0;
      b._eraHold = { path: nxt, hold: nxt[hi], hi, until: flip + 0.1, at: J.at, gate: nxt[gi], tGate: +tGate.toFixed(2), tDetour: +tDetour.toFixed(2) };
      this.stats.bots.prepos++;
    }
  }
  // (the registry's bot hook, each frame for each bot: a pre-positioned bot walks its new route to the hold spot and waits
  //  there, the next waypoint held at the hold spot; a foe, a new goal, death or the gate's flip ends the wait)
  botAct(b, dt, it, move) {
    const H = b._eraHold;
    if (!H) return null;
    if (this.tNow >= H.until || b.path !== H.path || b.target || b.mode !== 'paint' || !b.a.alive) { b._eraHold = null; return null; }
    b.goalTimer = Math.max(b.goalTimer, 0.5);
    const a = b.a, n = G.nav.nodes[H.hold];
    if ((b.pi | 0) >= H.hi && Math.hypot(a.pos.x - n.x, a.pos.z - n.z) < 1.3) {
      if (b.pi > H.hi) b.pi = H.hi;
      move.set(0, 0, 0); b.perchUntil = b.t + 0.3; b.wiggleT = 0; b.noProg = 0; b.dispT = 0; b.moveAcc = 0; b._needJump = false; b.snap?.copy?.(a.pos);
      if (!H.held) this.stats.bots.preposHeld++;
      H.held = (H.held || 0) + dt;
    }
    return null;
  }
  // H21 (the Bazookarp engine, wave 2: src/game/karpField.js): the carrier field's states, one per era — a node is a
  // carrier's in era e when the union graph has it valid in e. The field computes every state at load and switches at
  // era:done (its own listener: field.setState(field.stateOf(era)), never a rebuild); the registry forwards this as
  // G.match.stage.karpStates() (stageMods.js [b5-eras]). restMask(state) / dangerAt(pos) answer its drop spot.
  karpStates() {
    const nav = this.W.nav;
    if (!nav?.eraValid) return [];
    return [1, 2, 3].map((e) => ({ key: e, nodeOk: (id) => nav.eraValid[e - 1][id] === 1 }));
  }
  // the bot statistics at a flip: own squidkids on a top that just went, or inside a piece that just came
  _flipStats(on, off) {
    const L = this.W.level, B = L.blocks, S = this.stats.bots;
    for (const a of this.m.actors) {
      if (a.remote || !a.alive) continue;
      for (const id of off) {
        const b = B[id], top = this._topOf(b, a.pos.x, a.pos.z);
        if (top !== null && Math.abs(a.pos.y - top) < 0.35) { S.onVanish++; S.onVanishWho.push({ who: a.name, bot: !!a.bot, tag: b.tag, t: +this.tNow.toFixed(2) }); break; }
      }
      for (const id of on) if (this._bodyIn(a, B[id])) {
        S.inAppear++;
        // (who and how: a super jump's arc, a special's flight, a jump off a ledge — the shove's own case, for the audit)
        const sp = a.specialActive;
        (S.inAppearWho || (S.inAppearWho = [])).push({ who: a.name, bot: !!a.bot, tag: B[id].tag, t: +this.tNow.toFixed(2), pos: [a.pos.x, a.pos.y, a.pos.z].map((v) => +v.toFixed(2)),
          vy: a.vel ? +a.vel.y.toFixed(2) : null, grounded: !!a.grounded, form: a.form, sj: !!a.superJumpState, special: sp ? sp.kind || sp.id || '?' : null, goal: a.bot ? a.bot.mode || null : null });
        if (S.inAppearWho.length > 20) S.inAppearWho.shift();
        break;
      }
    }
    if (S.onVanishWho.length > 40) S.onVanishWho.shift();
  }
  // 4 Hz from the warning to done: bot-seconds inside an appearing piece's box before its flip (what the danger layer
  // should keep at ~0); and after each done, every own bot's first step onto ground new in that era
  _botTick(t, J) {
    if (this._botT !== undefined && t - this._botT < 0.25) return;
    const dtS = this._botT === undefined ? 0.25 : Math.min(0.5, t - this._botT);
    this._botT = t;
    const S = this.stats.bots, L = this.W.level, nav = G.nav;
    if (J && t >= J.warnAt && t < J.at + this.W.doneOff) {
      for (const a of this.m.actors) {
        if (!a.bot || a.remote || !a.alive) continue;
        for (const o of J.outlines) {
          if (!o.appear) continue;
          const b = L.blocks[o.id];
          if (t >= J.at + this.W.groups[b.eraG].rg / this.W.speed) continue;   // (after its flip it is simply there)
          if (a.pos.y < b.aabbMin.y - 1.4 || a.pos.y > b.aabbMax.y + 0.1) continue;
          const dx = a.pos.x - o.x, dz = a.pos.z - o.z, c = Math.cos(o.yaw), sn = Math.sin(o.yaw);
          if (Math.abs(dx * c - dz * sn) <= o.hx && Math.abs(dx * sn + dz * c) <= o.hz) { S.loiterS += dtS; S.loiterWho[a.name] = +((S.loiterWho[a.name] || 0) + dtS).toFixed(2); break; }
        }
      }
    }
    const V = this._visit;
    if (V && t <= V.doneAt + 30 && nav) {
      for (const a of this.m.actors) {
        if (!a.bot || a.remote || !a.alive || V.t[a.name] !== undefined) continue;
        const id = nav.nearest(a.pos, 1.2, true);
        if (id >= 0 && V.fresh[id]) V.t[a.name] = +(t - V.doneAt).toFixed(2);
      }
    } else if (V) this._visit = null;
  }
  _visitStart(J, t) {
    if (!J.fresh) return;
    const V = { jump: `${J.from}>${J.to}`, doneAt: +t.toFixed(2), fresh: J.fresh, t: {}, bots: this.m.actors.filter((a) => a.bot && !a.remote).map((a) => a.name) };
    this._visit = V;
    this.stats.bots.visits.push(V);
    if (this.stats.bots.visits.length > 12) this.stats.bots.visits.shift();
  }
  // a splat no weapon dealt (the sea, a fall) from a warning to its done + 2 s: what a jump could have caused
  _onSplat(e) {
    const v = e?.victim;
    if (!v || v.remote || e.remote || !this.m.actors.includes(v)) return;
    const t = this.tNow, A = this.activeAt(t);
    if (!A || t < A.at - this.W.warn || t > A.at + this.W.doneOff + 2) return;
    if (e.attacker || !(e.cause === 'water' || e.cause === 'fall' || e.cause === 'void' || !e.cause)) return;
    // (a jump's splat: within 4 m of a block that flipped in the last 2 s; any other such splat in the window is counted
    //  apart — a bot that walked off the quay as usual)
    const L = this.W.level, near = (this._recentFlips || []).some((f) => t - f.t <= 2 && f.ids.some((id) => { const b = L.blocks[id]; return Math.hypot(Math.max(b.aabbMin.x - v.pos.x, 0, v.pos.x - b.aabbMax.x), Math.max(b.aabbMin.z - v.pos.z, 0, v.pos.z - b.aabbMax.z)) <= 4; }));
    const row = { who: v.name, bot: !!v.bot, cause: e.cause, t: +t.toFixed(2), at: [+v.pos.x.toFixed(1), +v.pos.y.toFixed(1), +v.pos.z.toFixed(1)], byJump: near };
    if (near) this.stats.bots.envSplats++; else this.stats.bots.envOther = (this.stats.bots.envOther || 0) + 1;
    this.stats.bots.envSplatWho.push(row);
  }
  // the botlab's summary (match.cjs prints it): shoves (expected 0), the flip counts, the loiter time, the splats a jump
  // could have caused, the replans, the pre-positions, and per done the bots' times to new ground (median)
  botReport() {
    const S = this.stats.bots;
    const visits = S.visits.map((V) => {
      const ts = V.bots.map((n) => V.t[n]).filter((x) => x !== undefined).sort((a, b) => a - b);
      const med = V.bots.length ? (() => { const all = V.bots.map((n) => V.t[n] ?? Infinity).sort((a, b) => a - b); return all[Math.floor((all.length - 1) / 2)]; })() : null;
      return { jump: V.jump, doneAt: V.doneAt, bots: V.bots.length, visited: ts.length, within20: ts.filter((x) => x <= 20).length, median: med === Infinity ? null : med, times: ts };
    });
    return { eraShoves: this.stats.eraShoves, rescues: this.stats.rescues, flips: this.stats.flips, onVanish: S.onVanish, onVanishWho: S.onVanishWho.slice(-6), inAppear: S.inAppear, inAppearWho: (S.inAppearWho || []).slice(-6), loiterS: +S.loiterS.toFixed(2), loiterWho: S.loiterWho,
      envSplats: S.envSplats, envOther: S.envOther || 0, envSplatWho: S.envSplatWho.slice(-6), replans: S.replans, prepos: S.prepos, preposHeld: S.preposHeld, visits, era: this.era,
      // (the era the match started in and whether the audit held it there, ?era=n: a mislabelled per-era run shows in its log)
      start: this.sched.start, held: this.W.audit || 0, fixed: this.sched.fixed || 0, jumpsPlanned: this.sched.jumps.length, cycle: this.sched.cycle || 0, devices: this.stats.devices, zipEnds: (this.stats.zipEnds || []).length };
  }

  // one group to era e (at its flip): blocks, cells, devices, shoves, rescues, the event
  _flip(g, e, t) {
    const W = this.W, { on, off } = W._setGroup(g, e);
    if (!on.length && !off.length) return;
    W._flipCells(g);
    this._devices(off, on);
    if (off.length) { this._zips(off); (this._recentOff || (this._recentOff = [])).push({ t, ids: off }); }
    this._flipStats(on, off);
    (this._recentFlips || (this._recentFlips = [])).push({ t, ids: [...on, ...off] });
    while (this._recentFlips.length && t - this._recentFlips[0].t > 2.5) this._recentFlips.shift();
    if (on.length) this._shove(on, e);
    if (off.length) this._rescue(off, e);
    this.stats.flips++;
    this.stats.flipLog.push({ key: g.key, t: +t.toFixed(4), r: +g.rg.toFixed(2), era: e, on: on.length, off: off.length });
    if (this.stats.flipLog.length > 400) this.stats.flipLog.shift();
    if (this._popT === undefined || t - this._popT > 0.08) { this._popT = t; this._snd('era_pop', { pos: _q.set(g.cx, 2, g.cz).clone(), volume: 0.7 }); }
    emit('era:flip', { group: g.key, on, off, r: g.rg });
  }
  // this screen's own devices on a block that went or inside one that came (H17; the subs SPEC §0.3 / §0.6 leaves the subs
  // items to this walk, and the kits' devices to their own era:flip listeners). "On a block that went": stuck to one of
  // its faces, or resting on it / stuck to it with no face to say so (final review, issue 1: a Drip Curtain has no face,
  // and a gate's walls and roof are paint: false) — a point 5 cm into the surface it sits on (−normal; a curtain:
  // straight down) lies in a block that went and in nothing still solid. Each ends as the subs SPEC's era-flip ending:
  // [2, gid, 2] crushed (endWhy 2: the crunch on every screen — a ghost Lurk Mine or Cling Charge never blasts), one
  // 'device:down' { how: 'flip' }
  _devices(off, on) {
    const L = this.W.level, B = L.blocks;
    // the one destroyer (subs SPEC §0.3: block objects), once the deploy code has one: what came takes every device kind
    // inside it, the buoy and the kits' devices too (a device ends once: the walk below skips the dead). 0 until then
    if (on.length) this.S.crushIn({ blocks: on.map((id) => B[id]) }, 'flip');
    const subs = G.subs;
    if (!subs || !subs.items) return;
    const offSet = off.length ? new Set(off) : null;
    for (const it of [...subs.items]) {
      if (it.ghost || it.state === 'dead') continue;
      const stuck = offSet && it.face >= 0 && L.faces[it.face] && offSet.has(L.faces[it.face].block);
      const inside = on.length && it.pos && on.some((id) => L.pointInBlock(B[id], it.pos, 0.15));
      let rest = false;
      if (offSet && !stuck && !inside && it.pos && RESTING.has(it.state)) {
        _p.copy(it.pos).addScaledVector(it.state !== 'curtain' && it.normal ? it.normal : _UP, -0.05);
        rest = off.some((id) => L.pointInBlock(B[id], _p, 0.02)) && !L.pointInside(_p, 0.02);
      }
      if (!(stuck || inside || rest)) continue;
      it.endWhy = 2;
      if (G.deploy && typeof G.deploy.endLook === 'function') G.deploy.endLook(it, 2); else subs._destroy(it);
      if (it.state !== 'dead') subs._destroy(it);
      emit('device:down', { kind: it.kind, team: it.team, pos: it.pos.clone(), by: null, how: 'flip' });
      this.stats.devices++;
      if (rest) this.stats.devicesRest = (this.stats.devicesRest || 0) + 1;
    }
  }
  // DESIGN §3.7 (final review, issue 3): a Zipline anchored to a piece that went ends at once — its rider, zipping there
  // or clinging to it, drops where they are (no impact: the zip never arrived). Every screen does it for every rider at
  // its own flip: its own riders' bodies (the owner moves them), a remote rider's tether (a ghost: no record needed, the
  // owner's screen ends the zip at its own flip). `ghostsOnly`: the per-frame pass for 2.5 s after a flip (update) — a
  // ghost's late 'zi' record (the owner's zip landed just before ITS flip) would hang the tether on the gone piece again
  _zips(offIds, ghostsOnly = false) {
    const L = this.W.level, B = L.blocks;
    for (const a of this.m.actors) {
      const s = a.specialActive;
      if (!s || s.kind !== 'zipcaster' || !a.alive || (ghostsOnly && !s.ghost && !a.remote)) continue;
      const anc = s.zip ? s.zip.anchor : s.hang > 0 ? s.anchor : null;
      if (!anc || !offIds.some((id) => !B[id].solid && L.pointInBlock(B[id], anc, 0.12))) continue;
      const was = s.zip ? 'zip' : 'hang';
      s.zip = null; s.hang = 0; s.faceYaw = null;
      if (!s.ghost && !a.remote) { s.body = false; a.grounded = false; if (a.vel) a.vel.set(0, Math.min(0, a.vel.y), 0); }
      (this.stats.zipEnds || (this.stats.zipEnds = [])).push({ who: a.name, was, t: +this.tNow.toFixed(2), ghost: !!s.ghost || !!a.remote });
      if (this.stats.zipEnds.length > 20) this.stats.zipEnds.shift();
    }
  }
  // the top of block b at (x, z), or null off it
  _topOf(b, x, z) {
    const n = b.axes[1];
    if (n.y < 0.5) return null;
    _p.copy(b.center).addScaledVector(n, b.half.y);
    const y = _p.y - (n.x * (x - _p.x) + n.z * (z - _p.z)) / n.y;
    return this.W.level.pointInBlock(b, _q.set(x, y - 0.02, z), 0.001) ? y : null;
  }
  _bodyIn(a, b) {
    const L = this.W.level, r = PLAYER.radius * 0.9, top = a.form === 'squid' ? 0.6 : PLAYER.height * 0.95;
    for (const h of [0.12, top * 0.5, top]) {
      if (L.pointInBlock(b, _p.set(a.pos.x, a.pos.y + h, a.pos.z), 0)) return true;
      for (let k = 0; k < 8; k++) { const an = (k / 8) * Math.PI * 2; if (L.pointInBlock(b, _p.set(a.pos.x + Math.cos(an) * r, a.pos.y + h, a.pos.z + Math.sin(an) * r), 0)) return true; }
    }
    return false;
  }
  // an own squidkid a piece just appeared in: up onto it if its feet are within 0.8 m below the top and the body fits
  // there, else the first fitting spot round it (16 directions × 0.5–4 m, over floor, nothing in the way), else the
  // nearest nav node within 8 m outside the piece that is valid in the era the flip goes to `e` (a genuine teleport:
  // proxies snap)
  _shove(onIds, e = this.W.navEra) {
    const L = this.W.level, Ph = G.physics, EV = this._eraValid(e);
    for (const a of this.m.actors) {
      if (!shovable(a)) continue;
      const id = onIds.find((i) => this._bodyIn(a, L.blocks[i]));
      if (id === undefined) continue;
      const b = L.blocks[id], squid = a.form === 'squid';
      let done = false;
      const top = this._topOf(b, a.pos.x, a.pos.z);
      if (top !== null && top - a.pos.y <= 0.8 && top - a.pos.y >= -0.3 && Ph && Ph.bodyFits(_p.set(a.pos.x, top + 0.02, a.pos.z), PLAYER.radius, PLAYER.stepUp, PLAYER.height * 0.9, squid)) {
        a.pos.y = top + 0.02; if (a.vel) a.vel.y = Math.max(0, a.vel.y); done = true;
      }
      if (!done) {
        const spots = [];
        for (const d of [0.5, 1, 1.5, 2, 3, 4]) for (let k = 0; k < 16; k++) { const an = (k / 16) * Math.PI * 2; spots.push([a.pos.x + Math.cos(an) * d, a.pos.z + Math.sin(an) * d]); }
        done = shoveActor(a, spots, { floor: true, line: true }) >= 0 && !this._bodyIn(a, b);
      }
      if (!done) {
        const nav = G.nav;
        let best = -1, bd = 64;
        for (const n of nav.nodes) {
          if (!EV[n.id]) continue;
          const d2 = (n.x - a.pos.x) ** 2 + (n.z - a.pos.z) ** 2 + (nav.valid[n.id] ? 0 : 4);   // (ground that stays first)
          if (d2 >= bd || L.pointInBlock(b, _p.set(n.x, n.y + 0.5, n.z), 0.6) || !this._floorOk(n)) continue;
          if (Ph && !Ph.bodyFits(_p.set(n.x, n.y + 0.02, n.z), PLAYER.radius, PLAYER.stepUp, PLAYER.height * 0.9, squid)) continue;
          bd = d2; best = n.id;
        }
        if (best >= 0) { const n = nav.nodes[best]; a.pos.set(n.x, n.y + 0.02, n.z); if (a.vel) a.vel.set(0, 0, 0); a.netTp = (a.netTp || 0) + 1; done = true; }
      }
      this.stats.eraShoves++;
      if (a.stats) a.stats.eraShoves = (a.stats.eraShoves || 0) + 1;
      if (!done) console.warn('[eras] a shove found nowhere to go', a.name, b.tag);
    }
  }
  // a nav node with its floor in play now (the graph keeps the era before until done): solid ground under it, above water
  _floorOk(n) { const gh = this.W.level.groundHeight(n.x, n.z, n.y + 0.3); return gh > n.y - 0.25 && gh > PLAYER.waterY + 0.3; }
  // the highest top under (x, z) at or below y: { y, roof } (y −Infinity: nothing — water)
  _floorBelow(x, z, y, skipRoof = false) {
    const L = this.W.level, ids = L.queryBlocks(x - 0.01, z - 0.01, x + 0.01, z + 0.01, this._qb || (this._qb = []));
    let best = -Infinity, roof = false;
    for (const id of ids) {
      const b = L.blocks[id];
      if (!b.solid || b.dynamic) continue;
      if (skipRoof && b.roof) continue;
      const t = this._topOf(b, x, z);
      if (t !== null && t <= y && t > best) { best = t; roof = b.roof; }
    }
    return { y: best, roof };
  }
  // the highest top under (x, z) at or below y among the blocks that stand at stage time t (an era piece by its group's
  // flip at t, every other block as it is now): { y, roof, b } (y −Infinity: nothing — water)
  _floorAtT(x, z, y, t, skipRoof = false) {
    const L = this.W.level, ids = L.queryBlocks(x - 0.01, z - 0.01, x + 0.01, z + 0.01, this._qbt || (this._qbt = []));
    let best = -Infinity, roof = false, blk = null;
    for (const id of ids) {
      const b = L.blocks[id];
      if (b.dynamic || (b.presence ? !this.present(b, t) : !b.solid)) continue;
      if (skipRoof && b.roof) continue;
      const top = this._topOf(b, x, z);
      if (top !== null && top <= y && top > best) { best = top; roof = b.roof; blk = b; }
    }
    return { y: best, roof, b: blk };
  }
  // (the art phase's first commit: the final review's minor 1) a super jump launched onto an era piece that will be gone at
  // touchdown — its group flips before the flight ends, and the floor left under the landing is water, or a roof with
  // nothing walkable within 3.4 m below — lands where the rescue would put that kid instead: the nearest nav node (≤ 12 m)
  // whose floor stands at touchdown and that is valid in the era the jump goes to (ground that stays; valid in the era in
  // force as well first, the rescue's own order); none: the jumper's own pad. The owner's screen decides at launch (the
  // registry's superJumpLanding: charge → flight), and the 'superjump' record carries the moved landing to every screen.
  // Without it a teammate on a span or a garden tile in Practice's rewind was a landing into the river (the reviewer's
  // probe: bridge-2, bridge-3, garden-11, touchdown 0.3 s after the flip, 3 of 3 splatted)
  superJumpLanding(a, s) {
    if (!this.W.groups.length || !G.nav) return;
    const to = s.to, t0 = this.tNow, t1 = t0 + (s.dur || 1.5), tz = t1 + 0.4;   // (touchdown, and the landing's settle)
    const here = this._floorAtT(to.x, to.z, to.y + 0.4, t0);
    if (!here.b || !here.b.presence || here.y < to.y - 0.8) return;   // shared ground under the landing: it stays
    if (this.present(here.b, t1) && this.present(here.b, tz)) return;   // its piece is still there at touchdown
    const f = this._floorAtT(to.x, to.z, here.y - 0.05, tz);
    let bad = f.y === -Infinity || f.y < PLAYER.waterY + 0.25;
    if (!bad && f.roof) bad = this._floorAtT(to.x, to.z, f.y - 0.05, tz, true).y < f.y - 3.4;
    if (!bad) return;   // (it drops onto ground that stands: the flight lands there, as a walker would fall)
    const nav = G.nav, J = this.activeAt(t1), eTo = J ? J.to : this.eraInForce(tz), EV = this._eraValid(eTo), V0 = nav.valid;
    const cand = [];
    for (const n of nav.nodes) {
      if (!EV[n.id]) continue;
      const d2 = (n.x - to.x) ** 2 + (n.z - to.z) ** 2 + ((n.y - to.y) * 0.5) ** 2;
      if (d2 < 144) cand.push([d2, n]);
    }
    cand.sort((p, q) => p[0] - q[0]);
    const stands = (n) => { const fl = this._floorAtT(n.x, n.z, n.y + 0.3, tz); return fl.y > n.y - 0.25 && fl.y > PLAYER.waterY + 0.3; };
    let best = null;
    for (const ok of [(n) => V0[n.id], () => true]) {
      for (const [, n] of cand) if (ok(n) && stands(n)) { best = n; break; }
      if (best) break;
    }
    const from = [+to.x.toFixed(2), +to.y.toFixed(2), +to.z.toFixed(2)];
    if (best) to.set(best.x, best.y, best.z);
    else { const pad = G.level?.spawnPads?.[a.team]; if (pad) to.copy(pad); }
    this.stats.sjRedirects = (this.stats.sjRedirects || 0) + 1;
    this.stats.sjLog = this.stats.sjLog || [];
    if (this.stats.sjLog.length < 40) this.stats.sjLog.push({ who: a.name, t: +t0.toFixed(2), tag: here.b.tag, from, to: [+to.x.toFixed(2), +to.y.toFixed(2), +to.z.toFixed(2)], pad: !best });
  }
  // the nav's valid flags in era e (the union graph's per-era set; the era in force when there is none)
  _eraValid(e) { const nav = G.nav; return (e && nav.eraValid && nav.eraValid[e - 1]) || nav.valid; }
  // an own squidkid left over water, or on a roof with nothing walkable within 3.4 m below it, after a piece went from
  // under it: moved with a puff (never splatted) to the nearest nav node within 10 m whose floor stands now and that is
  // valid both in the era in force (until done, the era before) and in the era the flip goes to `e` — ground that stays
  // whatever the front still has to take or bring (final review 2, issue 2: the nearest node valid in the era in force
  // alone could be on a span or tile the front had not reached yet, so in Practice's rewind a kid hopped up to six times
  // across the river as each went); with none, one valid in `e` with the body fitting now; then the old rule
  _rescue(offIds, e = this.W.navEra) {
    const L = this.W.level, B = L.blocks;
    for (const a of this.m.actors) {
      if (!shovable(a)) continue;
      const hit = offIds.some((id) => { const b = B[id]; return a.pos.x > b.aabbMin.x - 0.8 && a.pos.x < b.aabbMax.x + 0.8 && a.pos.z > b.aabbMin.z - 0.8 && a.pos.z < b.aabbMax.z + 0.8 && a.pos.y > b.aabbMin.y - 0.3; });
      if (!hit) continue;
      const f = this._floorBelow(a.pos.x, a.pos.z, a.pos.y + 0.3);
      let bad = f.y === -Infinity || f.y < PLAYER.waterY + 0.25;
      if (!bad && f.roof) { const w = this._floorBelow(a.pos.x, a.pos.z, f.y - 0.05, true); bad = w.y < f.y - 3.4; }
      if (!bad) continue;
      const nav = G.nav, EV = this._eraValid(e), V0 = nav.valid, Ph = G.physics, squid = a.form === 'squid';
      // (the nav still describes the era before until done: only a node whose floor stands now, over dry land — tested
      //  nearest first, so the ground probe runs on a handful of nodes, not on every one within 10 m)
      const cand = [];
      for (const n of nav.nodes) {
        if (!EV[n.id] && !V0[n.id]) continue;
        const d2 = (n.x - a.pos.x) ** 2 + (n.z - a.pos.z) ** 2 + ((n.y - a.pos.y) * 0.5) ** 2;
        if (d2 < 100) cand.push([d2, n]);
      }
      cand.sort((p, q) => p[0] - q[0]);
      const fits = (n) => !Ph || Ph.bodyFits(_p.set(n.x, n.y + 0.02, n.z), PLAYER.radius, PLAYER.stepUp, PLAYER.height * 0.9, squid);
      let best = -1;
      for (const ok of [(n) => EV[n.id] && V0[n.id], (n) => EV[n.id] && fits(n), (n) => V0[n.id]]) {
        for (const [, n] of cand) if (ok(n) && this._floorOk(n)) { best = n.id; break; }
        if (best >= 0) break;
      }
      if (best < 0) continue;
      const n = nav.nodes[best];
      a.pos.set(n.x, n.y + 0.05, n.z); if (a.vel) a.vel.set(0, 0, 0); a.netTp = (a.netTp || 0) + 1;
      this.stats.rescues++;
      try { G.fx?.ring?.(_p.set(n.x, n.y + 0.08, n.z), new THREE.Vector3(0, 1, 0), this.W.uniforms.uEraColA.value, { radius: 1.6, life: 0.5 }); } catch (e) { /* optional */ }
    }
  }

  // ---------------------------------------------------------------- the view (uniforms, FX, HUD, environment) at time t
  _view(t, list) {
    const W = this.W, A = this.activeAt(t, list), J = A ? this._info(A) : null;
    const e = this.eraInForce(t, list);
    let phase = 'idle', front = -1, warnK = 0;
    if (J) {
      if (t < J.warnAt) phase = 'prebell';
      else if (t < J.at) { phase = 'warn'; warnK = Math.min(1, (t - J.warnAt) / W.warn) * 0.6 + (t > J.at - 3 ? 0.4 : 0); }
      else if (t < J.at + W.doneOff) { phase = 'jump'; front = (t - J.at) * W.speed; }
    }
    this.phase = phase; this.cur = J;
    W.jumping = phase === 'jump';
    const pa = t - this._pulseAt, pulse = pa >= 0 && pa < 4 ? 1 - pa / 4 : 0;   // (a clock moved back before a done: none)
    if (phase === 'jump') W.looks(J.from, J.to, front, 0, 0, J.from, J.to);
    else if (phase === 'warn' || phase === 'prebell') W.looks(e, e, -1, phase === 'warn' ? warnK : 0, 0, J.from, J.to);
    else { const lj = this._lastDone(t, list); W.looks(e, e, -1, 0, pulse, lj ? lj.from : e, lj ? lj.to : e); }
    if (this.fresh && t > this._freshUntil) this.fresh = null;
    // the environment: the time-lapse from J to done, the backdrop's horizon run
    if (phase === 'jump') this._timelapse(J, t); else if (this._envBase && !(J && t >= J.at)) this._envRestore();
    this._horizon(J, t);
    // FX
    let ringK = this._ringAt !== undefined && t - this._ringAt < this._ringLen ? 1 - (t - this._ringAt) / this._ringLen : 0;
    if (this._introRingAt !== undefined && this.m.state === 'intro') { const k = this.m.stateT - this._introRingAt; ringK = k >= 0 && k < 1.6 ? 1 - k / 1.6 : 0; }
    const pick = J && t >= J.at - 1 && t < J.at + 1.2 ? 1 : 0;
    const beam = J && t >= J.at - 1 && t < J.at + 0.6 ? Math.min(1, (t - (J.at - 1)) / 0.3) * (t > J.at + 0.3 ? 1 - (t - J.at - 0.3) / 0.3 : 1) : 0;
    const warnIn = J && phase === 'warn' ? Math.min(1, (t - J.warnAt) / 0.6) : 0;   // (the holograms and wires: up within 0.6 s of the warning)
    W.fx?.update(1 / 60, { t, jump: J, phase, front, warnK, warnIn, ring: ringK, pickup: pick, beam, pulse: phase === 'idle' || phase === 'prebell' ? pulse : 0 });
    // the front's ticking whoosh rides the front where it passes you
    if (this._fz && phase === 'jump' && G.camera) {
      const cam = G.camera.position, d = Math.hypot(cam.x, cam.z) || 1, near = Math.abs(d - front);
      this._fz.set({ pos: _p.set((cam.x / d) * front, cam.y - 1, (cam.z / d) * front), volume: Math.max(0, 1 - near / 24) * 0.9 });
    }
    // HUD
    if (this.chip) {
      const nx = this.nextAt(t, list), prev = this._lastDone(t, list);
      const t0 = prev ? prev.at + W.doneOff : 0, prog = nx ? Math.max(0, Math.min(1, (t - t0) / Math.max(1, nx.at - t0))) : 1;
      this.chip.update({ era: phase === 'jump' && J && front > 30 ? J.to : e, phase, next: nx ? { from: nx.from, to: nx.to, at: nx.at, inS: nx.at - t } : null, prog });
    }
  }
  _lastDone(t, list) { let r = null; for (const j of list) { if (t >= j.at + this.W.doneOff) r = j; else break; } return r; }
  // H13: from J to done the sky runs fast — the sun swings sunSwing° and back, clouds race cloudRate ×, the sky's colours
  // blend from the old era's look to the new; exposure and the grade are never touched (ink stays as readable)
  _timelapse(J, t) {
    const env = G.env, W = this.W;
    if (!env || !env.U || !env._stageTheme) return;
    if (!this._envBase || this._envBase.at !== J.at) {
      const save = W.envEra;
      W.envEra = J.from; const Tf = env._stageTheme(env.theme);
      W.envEra = J.to; const Tt = env._stageTheme(env.theme);
      W.envEra = save;
      this._envBase = { at: J.at, Tf, Tt, cloud: env.U.uCloudParams.value.z, fog: env.scene?.fog ? [env.scene.fog.near, env.scene.fog.far] : null };
    }
    const B = this._envBase, U = env.U, k = Math.min(1, (t - J.at) / W.doneOff), s = k * k * (3 - 2 * k), bump = Math.sin(Math.PI * k);
    const TL = W.E.timelapse || { sunSwing: 60, cloudRate: 20 };
    U.uZenith.value.set(B.Tf.zenith).lerp(_c.set(B.Tt.zenith), s);
    U.uSkyMid.value.set(B.Tf.skyMid).lerp(_c.set(B.Tt.skyMid), s);
    U.uHorizon.value.set(B.Tf.horizon).lerp(_c.set(B.Tt.horizon), s);
    if (B.Tf.haze && B.Tt.haze) U.uHaze.value.set(B.Tf.haze[0] + (B.Tt.haze[0] - B.Tf.haze[0]) * s, B.Tf.haze[1] + (B.Tt.haze[1] - B.Tf.haze[1]) * s, B.Tf.haze[2] + (B.Tt.haze[2] - B.Tf.haze[2]) * s, 0);
    if (env.scene?.fog?.isFog && B.Tf.fog && B.Tt.fog) { env.scene.fog.near = B.Tf.fog[0] + (B.Tt.fog[0] - B.Tf.fog[0]) * s; env.scene.fog.far = B.Tf.fog[1] + (B.Tt.fog[1] - B.Tf.fog[1]) * s; }
    const el = (B.Tf.sunEl + (B.Tt.sunEl - B.Tf.sunEl) * s) * DEG, az = (B.Tf.sunAz + (B.Tt.sunAz - B.Tf.sunAz) * s + TL.sunSwing * bump) * DEG;
    U.uSunDir.value.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)).normalize();
    U.uCloudParams.value.z = B.cloud * (1 + (TL.cloudRate - 1) * bump);
    W._lamps(J.to, J.from, s);
    env._fitShadow?.();
  }
  // done + 0.7 s: the new era's look settles — the uniforms the time-lapse blended are set to the new theme exactly, the
  // fog colour follows, and the env map (PMREM, 256) is rebuilt once; no cloud re-bake (the eras' looks never change the
  // clouds), so this costs a few ms where a full setTheme costs tens (ENGINE §7 risk 10)
  _envFinal(J) {
    const env = G.env, B = this._envBase;
    this._envBase = null;
    if (!env || !env.U || !B) return;
    const t = now(), U = env.U, T = B.Tt;
    U.uZenith.value.set(T.zenith); U.uSkyMid.value.set(T.skyMid); U.uHorizon.value.set(T.horizon);
    if (T.haze) U.uHaze.value.set(T.haze[0], T.haze[1], T.haze[2], 0);
    const el = T.sunEl * DEG, az = T.sunAz * DEG;
    U.uSunDir.value.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)).normalize();
    U.uCloudParams.value.z = B.cloud;
    if (U.uSeaAmbient && T.seaAmbientK !== undefined) U.uSeaAmbient.value.copy(U.uSkyMid.value).lerp(U.uHorizon.value, 0.5).multiplyScalar(T.seaAmbientK);
    if (env.fogColor) env.fogColor.copy(U.uHorizon.value).lerp(U.uSkyMid.value, 0.15);
    if (env.scene?.fog?.isFog) { env.scene.fog.color.copy(env.fogColor); if (T.fog) { env.scene.fog.near = T.fog[0]; env.scene.fog.far = T.fog[1]; } }
    env._fitShadow?.();
    env._rebuildEnvMap?.();
    this.W.stats.envFinalMs = Math.round((now() - t) * 10) / 10;
  }
  _envRestore() {
    const env = G.env, B = this._envBase;
    this._envBase = null;
    if (!env || !B) return;
    if (env.U?.uCloudParams) env.U.uCloudParams.value.z = B.cloud;
    if (env.setTheme && env.theme) env.setTheme(env.theme);
  }
  // the horizon run: as the front leaves the arena the backdrop's era sets swap, a radial wipe from R_max outward (1.3 s)
  _horizon(J, t) {
    const W = this.W, U = W.uniforms.uEraFar.value, S = W.env?.stageSets;
    if (!S || !J) { if (U.w) { U.w = 0; W._sets(W.envEra); } return; }
    const t0 = J.at + W.reach / W.speed, k = (t - t0) / 1.3;
    if (k >= 0 && k < 1) {
      U.set(eraBit(J.from), eraBit(J.to), W.reach + k * k * 1500, 1);
      for (const e of [1, 2, 3]) if (S[e]) S[e].visible = e === J.from || e === J.to;
    } else if (U.w) { U.w = 0; W._sets(k >= 1 ? J.to : J.from); }
  }

  // ---------------------------------------------------------------- the stage art's frozen front (?erafrom … : auditFront)
  // every group in its era at the front (b inside r, a outside), the looks, the curtain and the holograms at r — held
  // there every frame; no event, flip or jump runs (the clock never moves it). Also callable from a test or a shot script
  freeze({ from, to, front }) {
    const W = this.W;
    this._frz = { from, to, front };
    this.over = { start: from, jumps: [] };
    this._release();
    for (const g of W.groups) { const e = g.rg <= front ? to : from; if (g.era !== e) { W._setGroup(g, e); W._flipCells(g); } }
    W._setNavEra(from);
    this._frzJ = null;
    this._frozenView();
    return this.state();
  }
  _frozenView() {
    const W = this.W, F = this._frz, t = this.tNow;
    const J = this._info({ from: F.from, to: F.to, at: +(t - F.front / W.speed).toFixed(4) });
    this.phase = 'jump'; this.cur = J; W.jumping = true;
    if (!this._frzJ) { W.fx?.setJump(J); this._frzJ = J; }
    W.looks(F.from, F.to, F.front, 0, 0, F.from, F.to);
    W.uniforms.uEra.value.w = 0.01;   // (a still: each piece whole on its side of the front, not caught in its 0.3 s dissolve)
    W.fx?.update(1 / 60, { t, jump: J, phase: 'jump', front: F.front, warnK: 0, warnIn: 1, ring: 0, pickup: 0, beam: 0, pulse: 0 });
    this.chip?.update({ era: F.front > 30 ? F.to : F.from, phase: 'jump', next: null, prog: 1 });
  }

  // ---------------------------------------------------------------- queries
  // on / in a piece that changes in the coming or running jump (from the warning to done)
  dangerAt(pos, pad = 0.5) {
    const t = this.tNow, A = this.activeAt(t);
    if (!A || t < A.at - this.W.warn || t >= A.at + this.W.doneOff) return false;
    const J = this._info(A), L = this.W.level;
    for (const o of J.outlines) {
      const b = L.blocks[o.id];
      if (pos.y < b.aabbMin.y - 1.0 || pos.y > b.aabbMax.y + 0.5) continue;
      const dx = pos.x - o.x, dz = pos.z - o.z, c = Math.cos(o.yaw), s = Math.sin(o.yaw), lx = dx * c - dz * s, lz = dx * s + dz * c;
      if (Math.abs(lx) <= o.hx + pad && Math.abs(lz) <= o.hz + pad) return true;
    }
    return false;
  }
  danger(pos, pad) { return this.dangerAt(pos, pad); }
  // done (DESIGN §3.4: "… and pings on the minimap"): for 3 s after a done, what changed in that jump — the pieces that came
  // and the footprints that opened, and the groups they belong to — for drawEraMap's white-gold ping
  pings() {
    const t = this.tNow, a = t - this._pulseAt;
    if (!(a >= 0 && a < 3)) return null;
    const lj = this._lastDone(t, this.jumps(t));
    if (!lj) return null;
    const J = this._info(lj);
    return { age: a, dur: 3, outlines: J.outlines, groups: J.groups };
  }
  // the changing pieces' outlines (the minimap), from the warning to done
  outlines() { const t = this.tNow, J = this.cur; return J && t >= J.warnAt && t < J.at + this.W.doneOff ? J.outlines : []; }
  // per-era rest flags for Bazookarp (a node valid in the era in force and every later era of the match)
  restMask(state) { const nav = this.W.nav; if (!nav?.eraValid) return null; const e = state || this.era, out = new Uint8Array(nav.nodes.length); for (let i = 0; i < out.length; i++) { let ok = 1; for (let k = e; k <= 3; k++) if (!nav.eraValid[k - 1][i]) ok = 0; out[i] = ok; } return out; }
  goalWeight(id) { return this.fresh && this.fresh[id] ? 2 : 1; }
  drawMap(c, mm, tc, s, hex, t) { drawEraMap(this, c, mm, t); }

  state() {
    const t = this.tNow, nx = this.next, J = this.cur;
    return { era: this.era, phase: this.phase, from: J ? J.from : null, to: J ? J.to : null, t: +t.toFixed(3), next: nx, front: +this.front.toFixed(2),
      flips: this.stats.flips, navEra: this.W.navEra, turfTotal: this.W.paint?.turfTotal, eraShoves: this.stats.eraShoves, rescues: this.stats.rescues, devices: this.stats.devices };
  }
  // tests and audits only: a jump to `to` starting inS seconds from now (the warning and the pre-bell run if inS allows),
  // or the world put in `to` at once (instant)
  debugJump(to, { inS = 0, instant = false } = {}) {
    if (this._frz) { this._frz = null; this._frzJ = null; this.W.fx?.setJump(null); }
    const t = this.tNow, from = this.era;
    if (instant) { this.over = { start: to, jumps: [] }; this.seek(t, 'debug'); return null; }
    const j = { from, to, at: +(t + inS).toFixed(4) };
    this.over = { start: from, jumps: [j] };
    this._warned = null;
    if (inS < this.W.warn) { const J = this._info(j); this._warnState(J); }
    return { ...j, doneAt: j.at + this.W.doneOff };
  }

  dispose() {
    this._release();
    this._splatOff?.(); this._splatOff = null;
    for (const a of this.m.actors) if (a.bot) a.bot._eraHold = null;
    if (this._fz) { this._fz.stop(0.1); this._fz = null; }
    if (this._envBase) this._envRestore();
    this.chip?.dispose(); this.chip = null;
    const W = this.W;
    W.fx?.setJump(null);
    W.jumping = false;
    if (W.run === this) W.run = null;
    // the world rests in the era it reached (the next match's start applies its own)
    const e = W.groups.every((g) => g.era === W.groups[0]?.era) ? W.groups[0]?.era || 1 : null;
    if (e) { W.era = e; W.looks(e, e, -1, 0, 0); }
    W.uniforms.uEraFar.value.w = 0;
  }
}

registerStageMod({
  key: 'eras',
  order: 10,
  worldAs: 'eraWorld',   // G.eraWorld (the contract's name)
  matchAs: 'eras',       // G.match.eras (Bazookarp reads dangerAt / restMask, the HUD and bots the schedule)
  world: (ctx) => new EraWorld(ctx),
  match: (m, W, S) => StageEras.create(m, W, S),
});
