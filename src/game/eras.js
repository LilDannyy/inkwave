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
import { G, emit } from '../core/ctx.js';
import { PLAYER } from '../config.js';
import { registerStageMod } from './stageMods.js';
import { Level } from '../world/level.js';
import { NavGraph } from './nav.js';
import { navClaim, navCommit, navRelease, navNodesInBox, shovable, shoveActor } from './stageKit.js';
import { eraMask, eraBit, hasEra, groupKey, eraSchedule, cycleJumps, eraPieces, eraGroups } from '../world/eras-data.js';
import { eraLevelExt, eraMaterial, eraDepthMaterial, patchSetClip, EraFx, EraHud, drawEraMap } from '../fx/eraFx.js';
import '../audio/sfx-eras.js';

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const _p = new THREE.Vector3(), _q = new THREE.Vector3(), _c = new THREE.Color();
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

// ================================================================================================== the world
export class EraWorld {
  constructor(ctx) {
    const E = (this.E = ctx.data);
    this.names = E.names || ['1880s', 'TODAY', '3000s'];
    this.speed = E.speed || 25; this.guard = E.guard ?? 0.5; this.warn = E.warn ?? 10; this.prebell = E.prebell ?? 20;
    this.dissolve = this.speed * 0.3;   // the 0.3 s visual dissolve at a flip, in metres of front travel
    this.audit = auditEra();
    this.mode = ctx.mode;
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
    this.stats = { navMs: 0, mergeMs: 0, navBuilds: [], paintMs: 0, meshMs: 0, levelMs: 0, baseMs: [] };
    this._aoGate = (r, s, c, g) => { g.drawRange.count = s.overrideMaterial && this.jumping ? 0 : Infinity; };
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

  levelMaterial({ grate }) { return eraLevelExt(this.uniforms, grate); }
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
      mesh.onBeforeRender = this._aoGate;
      scene.add(mesh); this.meshes.push(mesh);
    }
    for (const m of props?._meshes || []) {
      const tag = m.userData.tag;
      if (!tag || tag[0] !== 'e') continue;
      m.userData.eraMask = +tag.slice(1);
      m.customDepthMaterial = eraDepthMaterial(this.uniforms, 'aTag');
      m.onBeforeRender = this._aoGate;
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

  attachMinimap(mm) { this.mm = mm; }
  mapBlock(b) { return !b.absent; }
  _present(e) { const bit = eraBit(e); return (b) => !b.dynamic && (b.presence ? (b.presence & bit) !== 0 : b.solid); }
  _mapEra(e) {
    const mm = this.mm;
    if (!mm || !mm.setBase) return;
    const t = now(); mm.setBase(e, this._present(e)); this.stats.baseMs.push(Math.round(now() - t));
  }
  // the other eras' minimap bases, built in idle time while the world rests (setBase caches them; done swaps for free)
  _prebuildBases() {
    const mm = this.mm, P = this.paint;
    if (!mm || !P || !mm.setBase) return;
    const cur = this.era;
    for (const e of [1, 2, 3]) {
      if (e === cur || (mm._bases && mm._bases.has(e))) continue;
      const save = P.dead; P.dead = this._deadFor(e);
      try { mm.setBase(e, this._present(e)); } finally { P.dead = save; }
    }
    mm.setBase(cur, this._present(cur));
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
  _envEra(e, apply = true) {
    if (this.envEra === e && !apply) return;
    const changed = this.envEra !== e;
    this.envEra = e;
    this._sets(e);
    this.uniforms.uEraFar.value.w = 0;
    if (apply && changed && this.env?.setTheme && this.env.theme) { const t = now(); this.env.setTheme(this.env.theme); this.stats.setThemeMs = Math.round(now() - t); }
  }

  ready() {
    this.apply(this.audit || 1, { why: 'start' });
    const idle = typeof requestIdleCallback === 'function' ? (fn) => requestIdleCallback(fn, { timeout: 2500 }) : (fn) => setTimeout(fn, 200);
    idle(() => { if (G.eraWorld === this && !this.jumping) this._prebuildBases(); });
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
    const vis = (m) => hasEra(m, from) || (front >= 0 && hasEra(m, to));
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
    this.stats = { eraShoves: 0, rescues: 0, flips: 0, devices: 0, frameMax: 0, flipLog: [] };
    this._jcache = new Map(); this._cyc = null;
    this.phase = 'idle'; this.cur = null; this.fresh = null; this._freshUntil = -1; this._pulseAt = -99;
    this.lastT = S.clock.t;
    // the starting era, before Zone Control / Tower Command / Boss Battle are built (BossNav sees era 2)
    const st = this.sched.start;
    if (W.era !== st || W.groups.some((g) => g.era !== st)) W.apply(st, { why: 'start', theme: true });
    else { W._setNavEra(st); W.looks(st, st, -1, 0, 0); }
    this.chip = m.attract ? null : new EraHud(this);   // (not `hud`: R.hud is a registry hook name)
    emit('era:set', { era: st, instant: true, why: 'start' });
  }
  get plan() { return this.over || this.sched; }
  get era() { return this.eraInForce(this.S.clock.t); }
  get front() { const J = this.cur; return J && this.phase === 'jump' ? (this.S.clock.t - J.at) * this.W.speed : -1; }

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
  eraAtPoint(x, z) { return this.eraAt(Math.hypot(x, z), this.S.clock.t); }
  // the jump whose pre-bell … clear window holds t
  activeAt(t, list = this.jumps(t)) { for (const j of list) { if (t >= j.at - this.W.prebell && t < j.at + this.W.doneOff + 1) return j; if (j.at - this.W.prebell > t) break; } return null; }
  nextAt(t, list = this.jumps(t)) { for (const j of list) if (t < j.at + this.W.doneOff) return j; return null; }
  get next() { const t = this.S.clock.t, j = this.nextAt(t); return j ? { from: j.from, to: j.to, at: j.at, inS: Math.max(0, j.at - t) } : null; }
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
  update(dt, t) {
    const W = this.W, f0 = now();
    const list = this.jumps(t);
    // every group to its era at this moment (a pure function of the clock): the front flips each when it reaches r_g
    for (const g of W.groups) { const e = this.eraAt(g.rg, t, list); if (g.era !== e) this._flip(g, e, t); }
    // events whose time passed this frame (a clock snap goes through seek instead)
    if (t > this.lastT && t - this.lastT < 1.0) this._events(this.lastT, t, list);
    this.lastT = t;
    this._view(t, list);
    const ms = now() - f0;
    if (ms > this.stats.frameMax) this.stats.frameMax = ms;
  }
  seek(t, why = 'clock') {
    const W = this.W, list = this.jumps(t);
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
  }
  _events(t0, t1, list) {
    for (const j of list) {
      if (j.at - this.W.prebell > t1) break;
      const J = this._info(j), D = this.W.doneOff;
      const ev = [[J.prebellAt, 'prebell'], [J.warnAt, 'warn'], [J.at - 5, 'ring'], [J.at - 3, 'short'], [J.at - 2, 'short'], [J.at - 1, 'pickup'], [J.at, 'jump'], [J.at + D, 'done'], [J.at + D + 0.7, 'env'], [J.at + D + 1, 'clear']];
      for (const [at, name] of ev) if (t0 < at && at <= t1) this._fire(name, J, t1);
    }
  }
  _say(text, sub, big) { this.S.callout(text, sub, big); }
  _snd(name, o = {}) { if (!this.m.attract) G.audio?.play?.(name, o); }
  _fire(name, J, t) {
    const W = this.W, N = W.names, T = new THREE.Vector3(0, 6.6, 0);
    const base = { from: J.from, to: J.to, at: J.at };
    switch (name) {
      case 'prebell':
        emit('era:prebell', { ...base, inS: W.prebell });
        this._snd('era_bell', { pos: T, volume: 0.8 });
        break;
      case 'warn':
        emit('era:warn', { ...base, inS: W.warn, names: N });
        this._say('TIME JUMP', `${N[J.from - 1]} → ${N[J.to - 1]} in ${W.warn}`, false);
        this._ring(J, 'warn');
        this._warnState(J);
        break;
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
        this._replan(J.to);
        W._mapEra(J.to);
        this.fresh = J.fresh; this._freshUntil = t + 30; this._pulseAt = t;
        const rewind = J.to < J.from;
        this._say(rewind ? `BACK TO THE ${N[J.to - 1]}` : J.to === 2 ? 'NEW ROUTES OPEN' : 'NEW AREAS!', N[J.to - 1], false);
        if (this._fz) { this._fz.stop(0.3); this._fz = null; }
        emit('era:done', { era: J.to });
        break;
      }
      case 'env': W._envEra(J.to, true); this._envBase = null; break;
      case 'clear':
        // what vanished goes blank (all late replays have landed): a rewind brings it back clean
        if (J.vanishFaces.length && W.paint) W.paint.clearFaces(J.vanishFaces);
        W.fx?.setJump(null);
        break;
    }
  }
  _ring(J, n) {
    this._ringAt = this.S.clock.t; this._ringLen = n === 'short' ? 0.4 : 1.6;
    emit('era:ring', { n, pos: [0, 6.6, 0] });
    this._snd('era_ring', { pos: new THREE.Vector3(0, 6.6, 0), volume: 1, n: n === 'short' ? 'short' : 'long' });
    if (n !== 'short') for (const p of this.W.fx?.phones || []) this._snd('era_kiosk', { pos: p.pos, volume: 0.8 });
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
    const L = navClaim('eras');
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
  // bots whose route runs an edge gone in the new era plan again
  _replan(e) {
    const nav = G.nav;
    for (const a of this.m.actors) {
      const b = a.bot;
      if (!b || !b.path) continue;
      if (e === null) { b.path = null; b.repath = 0; continue; }
      for (let i = Math.max(1, b.pi | 0); i < b.path.length; i++) if (!nav.edge(b.path[i - 1], b.path[i])) { b.path = null; b.repath = 0; break; }
    }
  }

  // one group to era e (at its flip): blocks, cells, devices, shoves, rescues, the event
  _flip(g, e, t) {
    const W = this.W, { on, off } = W._setGroup(g, e);
    if (!on.length && !off.length) return;
    W._flipCells(g);
    this._devices(off, on);
    if (on.length) this._shove(on);
    if (off.length) this._rescue(off);
    this.stats.flips++;
    this.stats.flipLog.push({ key: g.key, t: +t.toFixed(4), r: +g.rg.toFixed(2), era: e, on: on.length, off: off.length });
    if (this.stats.flipLog.length > 400) this.stats.flipLog.shift();
    if (this._popT === undefined || t - this._popT > 0.08) { this._popT = t; this._snd('era_pop', { pos: _q.set(g.cx, 2, g.cz).clone(), volume: 0.7 }); }
    emit('era:flip', { group: g.key, on, off, r: g.rg });
  }
  // this screen's own devices on a block that went (stuck to its faces) or inside one that came: the one destroyer
  _devices(off, on) {
    const L = this.W.level, S = this.S, B = L.blocks;
    const offSet = off.length ? new Set(off) : null;
    S.crushIn({ blocks: on, gone: off, where: (p) => on.some((id) => L.pointInBlock(B[id], p, 0.15)) }, 'flip');
    if (G.deploy && typeof G.deploy.crushIn === 'function') return;   // (the subs package's destroyer took them)
    const subs = G.subs;
    if (!subs || !subs.items) return;
    for (const it of [...subs.items]) {
      if (it.ghost || it.state === 'dead') continue;
      const stuck = offSet && it.face >= 0 && L.faces[it.face] && offSet.has(L.faces[it.face].block);
      const inside = on.length && it.pos && on.some((id) => L.pointInBlock(B[id], it.pos, 0.15));
      if (stuck || inside) { subs._destroy(it); this.stats.devices++; }
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
  // nearest valid nav node within 8 m outside the piece (a genuine teleport: proxies snap)
  _shove(onIds) {
    const L = this.W.level, Ph = G.physics;
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
          if (!nav.valid[n.id]) continue;
          const d2 = (n.x - a.pos.x) ** 2 + (n.z - a.pos.z) ** 2;
          if (d2 >= bd || L.pointInBlock(b, _p.set(n.x, n.y + 0.5, n.z), 0.6)) continue;
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
  // an own squidkid left over water, or on a roof with nothing walkable within 3.4 m below it, after a piece went from
  // under it: moved to the nearest valid nav node within 10 m with a puff (never splatted)
  _rescue(offIds) {
    const L = this.W.level, B = L.blocks;
    for (const a of this.m.actors) {
      if (!shovable(a)) continue;
      const hit = offIds.some((id) => { const b = B[id]; return a.pos.x > b.aabbMin.x - 0.8 && a.pos.x < b.aabbMax.x + 0.8 && a.pos.z > b.aabbMin.z - 0.8 && a.pos.z < b.aabbMax.z + 0.8 && a.pos.y > b.aabbMin.y - 0.3; });
      if (!hit) continue;
      const f = this._floorBelow(a.pos.x, a.pos.z, a.pos.y + 0.3);
      let bad = f.y === -Infinity || f.y < PLAYER.waterY + 0.25;
      if (!bad && f.roof) { const w = this._floorBelow(a.pos.x, a.pos.z, f.y - 0.05, true); bad = w.y < f.y - 3.4; }
      if (!bad) continue;
      const nav = G.nav;
      let best = -1, bd = 100;
      for (const n of nav.nodes) { if (!nav.valid[n.id]) continue; const d2 = (n.x - a.pos.x) ** 2 + (n.z - a.pos.z) ** 2 + ((n.y - a.pos.y) * 0.5) ** 2; if (d2 < bd) { bd = d2; best = n.id; } }
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
    const pulse = t - this._pulseAt < 4 ? 1 - (t - this._pulseAt) / 4 : 0;
    if (phase === 'jump') W.looks(J.from, J.to, front, 0, 0, J.from, J.to);
    else if (phase === 'warn' || phase === 'prebell') W.looks(e, e, -1, phase === 'warn' ? warnK : 0, 0, J.from, J.to);
    else { const lj = this._lastDone(t, list); W.looks(e, e, -1, 0, pulse, lj ? lj.from : e, lj ? lj.to : e); }
    if (this.fresh && t > this._freshUntil) this.fresh = null;
    // the environment: the time-lapse from J to done, the backdrop's horizon run
    if (phase === 'jump') this._timelapse(J, t); else if (this._envBase && !(J && t >= J.at)) this._envRestore();
    this._horizon(J, t);
    // FX
    const ringK = this._ringAt !== undefined && t - this._ringAt < this._ringLen ? 1 - (t - this._ringAt) / this._ringLen : 0;
    const pick = J && t >= J.at - 1 && t < J.at + 1.2 ? 1 : 0;
    const beam = J && t >= J.at - 1 && t < J.at + 0.6 ? Math.min(1, (t - (J.at - 1)) / 0.3) * (t > J.at + 0.3 ? 1 - (t - J.at - 0.3) / 0.3 : 1) : 0;
    W.fx?.update(1 / 60, { t, jump: J, phase, front, warnK, ring: ringK, pickup: pick, beam });
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
    env._fitShadow?.();
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

  // ---------------------------------------------------------------- queries
  // on / in a piece that changes in the coming or running jump (from the warning to done)
  dangerAt(pos, pad = 0.5) {
    const t = this.S.clock.t, A = this.activeAt(t);
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
  // the changing pieces' outlines (the minimap), from the warning to done
  outlines() { const t = this.S.clock.t, J = this.cur; return J && t >= J.warnAt && t < J.at + this.W.doneOff ? J.outlines : []; }
  // per-era rest flags for Bazookarp (a node valid in the era in force and every later era of the match)
  restMask(state) { const nav = this.W.nav; if (!nav?.eraValid) return null; const e = state || this.era, out = new Uint8Array(nav.nodes.length); for (let i = 0; i < out.length; i++) { let ok = 1; for (let k = e; k <= 3; k++) if (!nav.eraValid[k - 1][i]) ok = 0; out[i] = ok; } return out; }
  goalWeight(id) { return this.fresh && this.fresh[id] ? 2 : 1; }
  drawMap(c, mm, tc, s, hex, t) { drawEraMap(this, c, mm, t); }

  state() {
    const t = this.S.clock.t, nx = this.next, J = this.cur;
    return { era: this.era, phase: this.phase, from: J ? J.from : null, to: J ? J.to : null, t: +t.toFixed(3), next: nx, front: +this.front.toFixed(2),
      flips: this.stats.flips, navEra: this.W.navEra, turfTotal: this.W.paint?.turfTotal, eraShoves: this.stats.eraShoves, rescues: this.stats.rescues, devices: this.stats.devices };
  }
  // tests and audits only: a jump to `to` starting inS seconds from now (the warning and the pre-bell run if inS allows),
  // or the world put in `to` at once (instant)
  debugJump(to, { inS = 0, instant = false } = {}) {
    const t = this.S.clock.t, from = this.era;
    if (instant) { this.over = { start: to, jumps: [] }; this.seek(t, 'debug'); return null; }
    const j = { from, to, at: +(t + inS).toFixed(4) };
    this.over = { start: from, jumps: [j] };
    this._warned = null;
    if (inS < this.W.warn) { const J = this._info(j); this._warnState(J); }
    return { ...j, doneAt: j.at + this.W.doneOff };
  }

  dispose() {
    this._release();
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
