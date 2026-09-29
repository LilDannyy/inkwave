// Sprout pods: growable cover (Eco-Forest Treehills' gimmick — any stage can have them). Seed bulbs in low planters;
// ink one and a hedge bursts out of it: a team's own high ground and a wall across a lane for everyone.
//
// LAYOUT.pods = {
//   mirror: true,                                   // each listed pod gets its 180° twin ((x, z) → (−x, −z), rotY + π)
//   timing: { last: 20, wilt: 1.0, recharge: 6, grow: 0.5 },   // s (optional)
//   modes: { boss: 'on' },                          // per match mode: 'on' (default) | 'off' (inert bulbs)
//   bulbY: 0.5,                                     // the bulb's base over the pod's floor: its planter's height
//   planter: false,                                 // true / { type }: the engine draws + collides the planters too
//                                                   //   (a stage normally places its own, as props with colliders)
//   list: [{ id, pos: [x, y, z],                    // the pod on the floor at pos (y = floor height)
//            rotY: 0,                               // radians (like prop placements): turns the hedge
//            size: [w, h, d],                       // the hedge: width (local x, across rotY), height, depth (local z)
//            bulbY, col: [w, h, d],                 // optional per pod: its bulb's height; its planter's size (the
//                                                   //   hedge bursts out of that box; default 0.9 × 0.5 × 0.9)
//            pod: { type, ...PropKit opts },         // looks (props-pods.js has the contract); default sprout_pod /
//            hedge: { type, ...opts } }],           //   sprout_hedge
// }
//
// Rules:
//   • meters: each team has its own on every pod. A splat (any main, sub or special ink: Paint.splat forwards every
//     one, online ones too) reaching the bulb adds to its team's meter in proportion to how much of it lands (the share
//     of the bulb it covers × its size², × opts.pod for the weapons whose single shot should count for more). A meter
//     left alone drains. The first team to fill its meter grows the hedge — that team's hedge
//   • growing: it bursts out of the pod in PODS.timing.grow s (players and squids where it grows are shoved aside:
//     only where their body fits over floor, never through a wall or into the sea — if someone can't be, the pod waits,
//     meter full), stands `last` s, wilts `wilt` s (anyone on top is lowered with it) and recharges `recharge` s
//   • the hedge: a solid block (moves, shots and sight stop at it), tinted to its team. It takes its team's ink only:
//     walls in it are swum up, the top (standable) in it is ground to swim / refill / hide in (BoxPaint on the block,
//     read by Actor._surface / _wallInk). The other team's shots still hit it as cover. Its ink goes when it wilts
//   • Tower Command: a pod whose hedge would overlap the track (the platform's sweep + headroom) sits the mode out; any
//     other waits (meter full) while the tower's footprint + margin overlaps the hedge's box
//   • Boss Battle (modes.boss 'on'): a hedge stops HULLBREAKER's charge like a wall (BossNav.cast asks dynWall); it
//     tramples one it walks into (the hedge wilts); a pod waits while the boss stands where it would grow
//   • nav: the nodes a hedge covers (+ a player's width) are marked blocked (stageKit nav layers; bots replan)
//
// Sync: the host runs the meters (it sees every splat) and records ['g', pod, team, t] when a hedge grows (t: the stage
// clock, the synced match clock — stageKit.js StageClock), ['w', pod, t] when one is trampled early and ['m', meters…]
// (2 Hz, only when they changed) for the pods' look; followers replay them. Everything else (the pose, the wilt,
// the recharge) follows from the grow time on every client, and each client shoves its own squidkids.
//
// Bots (bots.js calls StagePods.bot): in a fight, a dormant pod whose hedge would stand between us and a foe we know
// of → ink it and fight from behind the hedge; our hedge near a fight / a zone we're guarding → ink a column of it,
// swim up and fight from the top.
import * as THREE from 'three';
import { G, clamp, angleDiff } from '../core/ctx.js';
import { PLAYER, TOWER } from '../config.js';
import { SFX, texture } from '../audio/audio.js';
import { BoxPaint } from './towerPaint.js';
import { Hit } from './physics.js';
import { TOWER_HEAD } from './tower.js';
import { StageClock, navClaim, navCommit, navRelease, navNodesInBox, shovable, shoveActor, floorFor, clearLine, buildLook, disposeLook } from './stageKit.js';

export const PODS = {
  timing: { grow: 0.5, last: 20, wilt: 1.0, recharge: 6 },
  bulbY: 0.5,             // the bulb's base over the pod's floor (its planter's height), unless the layout says
  bulbH: 0.5,             // the catch (what a splat must reach): a column of radius catchR from the floor to bulbY + bulbH
  catchR: 0.5,
  bulbCol: [0.5, 0.5],    // the bulb's own collider (w = d, h) on the planter: shots at it land on it; never inked
  skin: 0.02,             // the hedge's block is this much wider / deeper than its size: its faces stand clear of the planter's
  need: 7,                // ink to fill a meter: Σ cover × radius² (× opts.pod) — calibrated in tools/botlab/tests/pods.js
  drainDelay: 1.5,        // s without a team's ink before its meter drains …
  drain: 0.15,            // … at this much a second
  col: [0.9, 0.5, 0.9],   // the planter (w, h, d): the hedge bursts out of that box (and the engine's collider, if asked)
  towerMargin: 0.6,       // m round the tower's platform a hedge won't grow into
  bossMargin: 0.5,
  swell: 0.55,            // the bulb's scale-up at a full meter
  sheen: 0.07,            // the hedge's leaves (foliage) get this much of its team's ink as a sheen; blossoms (gloss) more
  blush: 0.55,            // a dormant bulb blushes up to this far toward the team that's ahead on it
};
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _c = new THREE.Color(), _c2 = new THREE.Color();
const WHITE = new THREE.Color(1, 1, 1), BROWN = new THREE.Color('#8a6a3a');
const smooth = (s) => s * s * (3 - 2 * s);
const easeOut = (s) => 1 - (1 - s) * (1 - s) * (1 - s);
const backOut = (s) => { const c = 1.9; return 1 + (c + 1) * Math.pow(s - 1, 3) + c * Math.pow(s - 1, 2); };

// ------------------------------------------------------------------------------------------------ the layout
// every pod (twins included) in a fixed order — the looks and the rules index them the same
let _warnedDeg = false;
export function podDefs(layout) {
  const def = layout && layout.pods;
  if (!def || !Array.isArray(def.list) || !def.list.length) return [];
  const out = [];
  for (const p of def.list) {
    if (!p || !Array.isArray(p.pos)) continue;
    let rot = +p.rotY || 0;
    if (Math.abs(rot) > TAU + 0.01) { if (!_warnedDeg) { _warnedDeg = true; console.warn('[inkwave] pods: rotY is in radians — read', rot, 'as degrees'); } rot *= DEG; }
    const [w, h, d] = p.size || [3, 1.8, 0.9], col = p.col || def.col || PODS.col;
    const bulbY = p.bulbY ?? def.bulbY ?? PODS.bulbY;
    for (const twin of def.mirror ? [false, true] : [false]) {
      const s = twin ? -1 : 1;
      out.push({ id: (p.id || 'pod' + out.length) + (twin ? '~' : ''), x: s * p.pos[0], y: p.pos[1] ?? 0, z: s * p.pos[2], yaw: rot + (twin ? Math.PI : 0),
        w, h, d, col, bulbY, pod: p.pod || {}, hedge: p.hedge || {}, planter: def.planter || null, twin });
    }
  }
  return out;
}
// the engine's planters' colliders (Level extras: solid, never inked, a top you slide off) — only when the layout asks
// for the engine's planters (pods.planter); a stage normally places its own planters as props with their colliders
export function podColliders(layout) {
  return podDefs(layout).filter((p) => p.planter).map((p) => ({ obox: true, center: [p.x, p.y + p.col[1] / 2, p.z], size: [...p.col], rotY: p.yaw / DEG, roof: true }));
}

// ------------------------------------------------------------------------------------------------ the looks (per world)
// The bulbs (and, when the layout asks for them, the engine's planters), built with the stage (main.js _buildWorldNow)
// so they're there in every shot, match or not; the match's StagePods drives each bulb's swell / blush / glow. Each bulb
// has its own copies of its materials. The hedges are built here too, once per team in that team's ink (`tint`), and
// again whenever the palette changes (hedge()).
export class PodLooks {
  constructor(layout) {
    this.defs = podDefs(layout);
    this.items = [];
    this.palKey = '';
    if (!this.defs.length || !G.scene) return;
    const kit = G.game?.props;
    for (const d of this.defs) {
      const root = new THREE.Group();
      root.name = 'pod:' + d.id;
      root.position.set(d.x, d.y, d.z); root.rotation.y = d.yaw;
      const type = d.pod.type && kit?.hasType?.(d.pod.type) ? d.pod.type : 'sprout_pod';
      let planter = null;
      if (d.planter) { planter = buildLook({ ...d.pod, ...(typeof d.planter === 'object' ? d.planter : {}), type: d.planter.type || type, part: 'planter' }, 'sprout_pod'); root.add(planter); }
      // the bulb: its origin at its base, anchored on the planter at bulbY, scaled from there
      const pivot = new THREE.Group(); pivot.position.set(0, d.bulbY, 0);
      const bulb = buildLook({ ...d.pod, type, part: 'bulb' }, 'sprout_pod');
      pivot.add(bulb); root.add(pivot);
      const mats = [];
      bulb.traverse((m) => { if (!m.isMesh || !m.material) return; m.material = m.material.clone(); mats.push(m.material); m.material.userData.c0 = m.material.color.clone(); });
      G.scene.add(root);
      this.items.push({ def: d, root, planter, pivot, bulb, mats, k: -1, hedge: null });
    }
  }
  // pod i's bulb: swell 0…1 (the meter), blush toward team t (−1: none) by k, glow 0…1; show false hides it (a hedge);
  // size: its overall scale (a bulb growing back after a wilt)
  set(i, swell, t, k, glow, show = true, size = 1) {
    const it = this.items[i];
    if (!it) return;
    it.pivot.visible = show;
    if (!show) return;
    const s = (1 + PODS.swell * swell) * size;
    if (Math.abs(s - it.k) > 1e-3) { it.k = s; it.pivot.scale.set(s, s * (1 + 0.08 * swell), s); }
    const col = t >= 0 && G.teamColors ? G.teamColors[t] : null;
    for (const m of it.mats) {
      m.color.copy(m.userData.c0);
      if (col && k > 0) m.color.lerp(_c.copy(col), k);
      if (m.emissive) { if (col && glow > 0) m.emissive.copy(col).multiplyScalar(glow); else m.emissive.setRGB(0, 0, 0); }
    }
  }
  reset() { for (let i = 0; i < this.items.length; i++) { this.set(i, 0, -1, 0, 0, true); const h = this.items[i].hedge; if (h) { h.root.visible = false; h.root.scale.set(1, 1, 1); } } }

  // pod i's hedge looks: { root (at the pod, turned; the rules scale it), team: [look in team 0's ink, team 1's],
  // mats: [[its foliage / gloss material copies], …] } — (re)built for the current palette
  hedge(i) {
    const it = this.items[i];
    if (!it || !G.teamColors) return null;
    const key = G.teamColors.map((c) => c.getHexString()).join();
    if (key !== this.palKey) { this.palKey = key; for (const x of this.items) this._dropHedge(x); }
    if (!it.hedge) it.hedge = this._buildHedge(it.def);
    return it.hedge;
  }
  _buildHedge(d) {
    const kit = G.game?.props;
    const root = new THREE.Group();
    root.name = 'hedge:' + d.id;
    root.position.set(d.x, d.y, d.z); root.rotation.y = d.yaw;
    const type = d.hedge.type && kit?.hasType?.(d.hedge.type) ? d.hedge.type : 'sprout_hedge';
    const team = [], mats = [];
    for (let t = 0; t < 2; t++) {
      const look = buildLook({ ...d.hedge, type, size: [d.w, d.h, d.d], w: d.w, h: d.h, d: d.d, tint: G.teamColors[t].clone(), team: t }, 'sprout_hedge');
      look.userData.tint = G.teamColors[t].getHexString();
      const ms = [];
      // (its own copies of the leaf / blossom materials: a sheen of the team's ink, browning as it wilts)
      look.traverse((m) => {
        if (!m.isMesh || !m.material || !kit?.mat) return;
        const kind = m.material === kit.mat.foliage ? 'leaf' : m.material === kit.mat.gloss ? 'bloom' : null;
        if (!kind) return;
        m.material = m.material.clone(); m.material.userData.c0 = m.material.color.clone();
        ms.push({ m: m.material, kind });
      });
      look.visible = false;
      root.add(look);
      team.push(look); mats.push(ms);
    }
    root.visible = false;
    G.scene?.add(root);
    return { root, team, mats };
  }
  _dropHedge(it) {
    const h = it.hedge;
    if (!h) return;
    for (const ms of h.mats) for (const { m } of ms) m.dispose();
    for (const look of h.team) disposeLook(look);
    for (const c of [...h.root.children]) h.root.remove(c);   // (a match's ink overlay is its own to dispose)
    h.root.removeFromParent();
    it.hedge = null;
  }
  dispose() {
    for (const it of this.items) {
      for (const m of it.mats) m.dispose();
      disposeLook(it.planter); disposeLook(it.bulb);
      this._dropHedge(it);
      it.root.removeFromParent();
    }
    this.items.length = 0;
  }
}

// ------------------------------------------------------------------------------------------------ geometry helpers
// share of a disc of radius R covered by a disc of radius r whose centre is d away (0…1)
function coverFrac(r, R, d) {
  if (d >= r + R) return 0;
  if (d <= Math.abs(r - R)) return Math.min(1, (Math.min(r, R) * Math.min(r, R)) / (R * R));
  const a = r * r * Math.acos(clamp((d * d + r * r - R * R) / (2 * d * r), -1, 1)) + R * R * Math.acos(clamp((d * d + R * R - r * r) / (2 * d * R), -1, 1))
    - 0.5 * Math.sqrt(Math.max(0, (-d + r + R) * (d + r - R) * (d - r + R) * (d + r + R)));
  return clamp(a / (Math.PI * R * R), 0, 1);
}
// two turned rectangles (centre, yaw, half sizes) overlap? (separating axes)
function rectsOverlap(ax, az, ay, ahx, ahz, bx, bz, by, bhx, bhz) {
  const A = [[Math.cos(ay), -Math.sin(ay)], [Math.sin(ay), Math.cos(ay)]], B = [[Math.cos(by), -Math.sin(by)], [Math.sin(by), Math.cos(by)]];
  const dx = bx - ax, dz = bz - az;
  for (const [ux, uz] of [...A, ...B]) {
    const ra = ahx * Math.abs(A[0][0] * ux + A[0][1] * uz) + ahz * Math.abs(A[1][0] * ux + A[1][1] * uz);
    const rb = bhx * Math.abs(B[0][0] * ux + B[0][1] * uz) + bhz * Math.abs(B[1][0] * ux + B[1][1] * uz);
    if (Math.abs(dx * ux + dz * uz) > ra + rb) return false;
  }
  return true;
}

// ------------------------------------------------------------------------------------------------ the rules (per match)
export class StagePods {
  // null when the stage has none, or they sit this mode out
  static create(match) {
    const layout = G.level?.layout, defs = podDefs(layout);
    if (!defs.length) return null;
    const mode = (layout.pods.modes && layout.pods.modes[match.mode]) || 'on';
    if (mode === 'off') return null;
    return new StagePods(match, layout.pods, defs);
  }

  constructor(match, def, defs) {
    this.match = match;
    this.def = def;
    this.T = { ...PODS.timing, ...(def.timing || {}) };
    this.clock = new StageClock();
    const L = G.game?.podLooks;
    this.looks = L && L.items.length === defs.length ? L : null;
    this.looks?.reset();
    this.pods = defs.map((d, i) => this._makePod(d, i));
    this.snapT = 0; this.sent = null;
    this.stats = { grown: 0, held: 0, shoved: 0, trampled: 0, carried: 0 };
    // Tower Command: pods whose hedge would stand on the track sit the mode out
    const T = match.tower;
    if (T) for (const p of this.pods) if (this._onTrack(p, T)) { p.off = 'track'; p.bulbBlock.solid = false; console.warn('[inkwave] pods:', p.id, 'would grow onto the tower track — off in Tower Command'); }
    // nav: this set's own layer
    this.blk = navClaim(this);
    this.navDirty = false;
    // Boss Battle: its charge stops at a hedge
    if (G.boss?.nav) { this.bossNav = G.boss.nav; this.bossNav.dynWall = (x, z, r) => this.bossWall(x, z, r); }
    this.leaves = G.scene && typeof document !== 'undefined' ? new LeafPuffs(G.scene) : null;
  }
  get follower() { return !!this.match.follower; }
  get t() { return this.clock.t; }
  _net(e) { if (!this.follower) G.netm?.recPods?.(e); }

  _makePod(d, i) {
    const p = { i, id: d.id, def: d, x: d.x, y: d.y, z: d.z, yaw: d.yaw, w: d.w, h: d.h, d: d.d,
      meter: [0, 0], inkT: [-9, -9], fullT: [-1, -1], rustleT: -9,
      state: 'dormant', owner: -1, t0: 0, wiltAt: 0, off: '', held: '',
      frame: { pos: new THREE.Vector3(d.x, d.y, d.z), yaw: d.yaw },
      block: null, paint: null, look: null, inkMesh: null, k: 0, top: d.y,
      c: Math.cos(d.yaw), s: Math.sin(d.yaw) };
    // the hedge's block (a dynamic level block: parked, not solid, until it grows) — a skin wider than its size
    p.hw = d.w / 2 + PODS.skin / 2; p.hd = d.d / 2 + PODS.skin / 2;
    p.block = G.level.addDynamic({ tag: 'hedge:' + d.id });
    p.block.solid = false;
    G.level.moveDynamic(p.block, _v.set(1e4 + i * 10, -50, 1e4), _v2.set(0.1, 0.1, 0.1), 0);
    // the bulb's (solid while it's there to shoot at: dormant)
    const [bw, bh] = PODS.bulbCol;
    p.bulbBlock = G.level.addDynamic({ tag: 'pod:' + d.id, roof: true });
    G.level.moveDynamic(p.bulbBlock, _v.set(d.x, d.y + d.bulbY + bh / 2, d.z), _v2.set(bw / 2, bh / 2, bw / 2), d.yaw);
    // its ink: the grower's only
    if (typeof document !== 'undefined') {
      p.paint = new BoxPaint(p.frame, { hx: p.hw, hz: p.hd, h: d.h, ppm: 48, accept: (t) => t === p.owner && (p.state === 'stand' || p.state === 'wilt') });
      p.block.inkPaint = p.paint;
    }
    // nav nodes under it (+ a player's width), on its floor
    p.nav = G.nav ? navNodesInBox(d.x, d.z, d.yaw, d.w / 2, d.d / 2, PLAYER.radius + 0.25, d.y - 1.0, d.y + 0.6) : [];
    // its ink's look, drawn from the paint's canvas just off the hedge's faces (on the hedge's look: _hedge)
    if (p.paint && G.scene) {
      const mat = new THREE.MeshStandardMaterial({ map: p.paint.texture, transparent: true, roughness: 0.3, metalness: 0, side: THREE.DoubleSide,
        depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
      const ink = p.paint.inkMesh(mat);
      ink.renderOrder = 1; ink.name = 'hedge-ink:' + d.id;
      ink.onBeforeRender = (r, scene, cam, geo) => { geo.drawRange.count = scene.overrideMaterial ? 0 : Infinity; };   // (out of the AO pass)
      p.inkMesh = ink;
    }
    this._hedge(p);                      // (its looks built now, while loading)
    return p;
  }
  // the hedge's looks (PodLooks: one per team, rebuilt when the palette changes) with this match's ink on them
  _hedge(p) {
    const h = this.looks?.hedge(p.i) || null;
    if (h !== p.look) {
      p.look = h;
      if (h && p.inkMesh) h.root.add(p.inkMesh);
      if (h) this._showHedge(p);
    }
    return h;
  }
  _showHedge(p) {
    const h = p.look;
    if (!h) return;
    const on = !!(p.block && p.block.solid) && p.owner >= 0;
    h.root.visible = on;
    h.team.forEach((g, t) => { g.visible = on && t === p.owner; });
  }

  // ---- the phase of a pod at stage time t (a pure function of its grow time: every client agrees)
  _phase(p, t) {
    if (p.state === 'dormant' && p.owner < 0) return { st: 'dormant', u: 0 };
    const T = this.T, u = t - p.t0;
    if (u < T.grow) return { st: 'grow', u: Math.max(0, u) / T.grow };
    if (t < p.wiltAt) return { st: 'stand', u: (u - T.grow) / T.last };
    if (t < p.wiltAt + T.wilt) return { st: 'wilt', u: (t - p.wiltAt) / T.wilt };
    if (t < p.wiltAt + T.wilt + T.recharge) return { st: 'recharge', u: (t - p.wiltAt - T.wilt) / T.recharge };
    return { st: 'dormant', u: 0 };
  }

  // ---- per frame (Match.update, before bots and actors move)
  update(dt) {
    const m = this.match, t = this.clock.tick(m, dt);
    const live = m.state === 'playing';
    for (const p of this.pods) {
      if (p.off) continue;
      const ph = this._phase(p, t);
      if (ph.st !== p.state) this._enter(p, ph.st, t);
      if (p.state === 'dormant') {
        if (live) this._meters(p, t, dt);
      }
      this._pose(p, ph, dt);
    }
    if (G.boss) this.bossStep();
    if (this.navDirty) { this.navDirty = false; this._navMark(); }
    // host: the meters' look for the followers (2 Hz, when they changed)
    if (!this.follower && G.netm && (this.snapT -= dt) <= 0) {
      this.snapT = 0.5;
      const q = []; for (const p of this.pods) q.push(Math.round(p.meter[0] * 100), Math.round(p.meter[1] * 100));
      if (!this.sent || q.some((v, k) => Math.abs(v - this.sent[k]) >= 2)) { this.sent = q; this._net(['m', ...q]); }
    }
    this._looks(dt);
    this.leaves?.update(dt);
  }

  // meters: drain; the first team to a full meter grows it (the host decides; followers wait for its record)
  _meters(p, t, dt) {
    for (let k = 0; k < 2; k++) {
      if (p.meter[k] <= 0 || p.meter[k] >= 1) continue;
      if (t - p.inkT[k] > PODS.drainDelay) p.meter[k] = Math.max(0, p.meter[k] - PODS.drain * dt);
    }
    if (this.follower) return;
    const full = [0, 1].filter((k) => p.meter[k] >= 1).sort((a, b) => p.fullT[a] - p.fullT[b]);
    if (!full.length) { p.held = ''; return; }
    const why = this._blocked(p);
    if (why) { if (p.held !== why) this.stats.held++; p.held = why; return; }
    p.held = '';
    this.grow(p, full[0], t);
  }

  // why a full pod can't grow right now ('' = it can): the tower / the boss in the way, someone it can't shove aside
  _blocked(p) {
    const T = this.match.tower;
    if (T && this._towerIn(p, T)) return 'tower';
    const B = G.boss;
    if (B && !B.dead && this._bossIn(p, B, PODS.bossMargin)) return 'boss';
    for (const a of this.match.actors) {
      if (!a.alive || a.superJumpState) continue;
      if (!this._inBox(p, a, 1, 1, 1, 0.02)) continue;
      if (!this._escapes(p, a, 1).length) return 'player';
    }
    return '';
  }
  _towerIn(p, T) {
    const R = TOWER.platformR + PODS.towerMargin;
    if (T.pos.y > p.y + p.h || T.pos.y + TOWER_HEAD < p.y) return false;
    return rectsOverlap(p.x, p.z, p.yaw, p.hw, p.hd, T.pos.x, T.pos.z, T.yaw, R, R);
  }
  // the hedge's box over the tower track (the platform's sweep and its headroom), all the way along
  _onTrack(p, T) {
    const R = TOWER.platformR;
    for (let s = -T.path.len[1]; s <= T.path.len[0]; s += 0.4) {
      const q = T.path.at(s, _v);
      if (q.y > p.y + p.h || q.y + TOWER_HEAD < p.y) continue;
      if (rectsOverlap(p.x, p.z, p.yaw, p.hw, p.hd, q.x, q.z, T.yaw, R, R)) return true;
    }
    return false;
  }
  _bossIn(p, B, pad) {
    const s = Math.sin(B.yaw), c = Math.cos(B.yaw);
    for (const [z, r] of [[2.3, 2.5], [-1.8, 2.6]]) if (this._rectDist(p, B.pos.x + s * z, B.pos.z + c * z) < r + pad) return true;
    return false;
  }
  // distance from (x, z) to the hedge's footprint (0 inside)
  _rectDist(p, x, z) {
    const dx = x - p.x, dz = z - p.z, lx = dx * p.c - dz * p.s, lz = dx * p.s + dz * p.c;
    const ex = Math.max(0, Math.abs(lx) - p.hw), ez = Math.max(0, Math.abs(lz) - p.hd);
    return Math.hypot(ex, ez);
  }
  // BossNav.cast: is a standing hedge within r of (x, z)?
  bossWall(x, z, r) {
    for (const p of this.pods) if (p.block && p.block.solid && this._rectDist(p, x, z) < r) return true;
    return false;
  }

  // is actor a (feet at a.pos) inside the hedge's box scaled kx × ky × kz (+ its body radius + pad)?
  _inBox(p, a, kx, ky, kz, pad = 0) {
    const top = p.y + p.h * ky;
    if (a.pos.y > top - 0.05 || a.pos.y + (a.form === 'squid' ? 0.6 : PLAYER.height) < p.y) return false;
    const dx = a.pos.x - p.x, dz = a.pos.z - p.z, lx = dx * p.c - dz * p.s, lz = dx * p.s + dz * p.c;
    const r = PLAYER.radius + pad;
    return Math.abs(lx) < p.hw * kx + r && Math.abs(lz) < p.hd * kz + r;
  }
  // where a can be shoved to, out of the box scaled k (nearest side first): the spots that are clear of walls, over floor
  // and reached along a clear line (the final box's sides: it only grows)
  _escapes(p, a, k) {
    const dx = a.pos.x - p.x, dz = a.pos.z - p.z, lx = dx * p.c - dz * p.s, lz = dx * p.s + dz * p.c;
    const r = PLAYER.radius + 0.06, hx = p.hw * k + r, hz = p.hd * k + r;
    const cands = [[lx, Math.sign(lz || 1) * hz], [lx, -Math.sign(lz || 1) * hz], [Math.sign(lx || 1) * hx, lz], [-Math.sign(lx || 1) * hx, lz]]
      .map(([x, z]) => ({ x, z, d: Math.hypot(x - lx, z - lz) })).sort((q, w) => q.d - w.d);
    const out = [];
    for (const q of cands) {
      const wx = p.x + q.x * p.c + q.z * p.s, wz = p.z - q.x * p.s + q.z * p.c;
      _v.set(wx, a.pos.y, wz);
      if (G.physics && !G.physics.bodyFits(_v, PLAYER.radius, PLAYER.stepUp, PLAYER.height * 0.9, a.form === 'squid')) continue;
      if (!floorFor(a, wx, wz) || !clearLine(a.pos, wx, wz)) continue;
      out.push([wx, wz]);
    }
    return out;
  }

  // ---- a hedge grows: team t's, at stage time t0 (the host's call, or its record replayed)
  grow(p, team, t0) {
    p.owner = team; p.t0 = t0; p.wiltAt = t0 + this.T.grow + this.T.last;
    p.meter[0] = p.meter[1] = 0; p.fullT[0] = p.fullT[1] = -1; p.held = '';
    p.state = 'dormant';                  // (_enter('grow') runs on the next update: the phase decides)
    this.stats.grown++;
    this._net(['g', p.i, team, +t0.toFixed(3)]);
    const ph = this._phase(p, this.clock.t);
    this._enter(p, ph.st, this.clock.t);
    this._pose(p, ph, 0);
  }
  // …and wilts early (trampled)
  wilt(p, tw) {
    if (p.state !== 'grow' && p.state !== 'stand') return;
    p.wiltAt = tw;
    this.stats.trampled++;
    this._net(['w', p.i, +tw.toFixed(3)]);
  }

  _enter(p, st, t) {
    const prev = p.state;
    p.state = st;
    const au = this.match.attract ? null : G.audio;
    p.bulbBlock.solid = st === 'dormant' && !p.off;
    if (st === 'grow' || (st === 'stand' && prev !== 'grow')) {
      p.block.solid = true;
      p.paint?.clear();
      this._hedge(p); this._showHedge(p);
      this.navDirty = true;
      _v.set(p.x, p.y + p.h * 0.5, p.z);
      au?.play?.('pod_grow', { pos: _v, volume: 0.9 });
      this.leaves?.puff(p, p.owner, 44);
      this._tintHedge(p);
    } else if (st === 'wilt') {
      _v.set(p.x, p.y + p.h * 0.5, p.z);
      au?.play?.('pod_wilt', { pos: _v, volume: 0.8 });
      this.leaves?.puff(p, -1, 18, true);
    } else if (st === 'recharge' || st === 'dormant') {
      if (p.block.solid) { p.block.solid = false; G.level.moveDynamic(p.block, _v.set(1e4 + p.i * 10, -50, 1e4), _v2.set(0.1, 0.1, 0.1), 0); this.navDirty = true; }
      p.paint?.clear();
      if (st === 'dormant') { p.owner = -1; p.meter[0] = p.meter[1] = 0; }
      this._showHedge(p);
    }
  }

  // the block + look at this moment of its phase; shove during the growth; carry down during the wilt
  _pose(p, ph, dt) {
    const T = this.T;
    let kx = 1, ky = 1, kz = 1, vis = 1, visY = 1, brown = 0;
    const cw = Math.min(1, p.def.col[0] / p.w), cd = Math.min(1, p.def.col[2] / p.d), ch = Math.min(1, p.def.col[1] / p.h);
    if (ph.st === 'grow') {
      const e = easeOut(ph.u);
      kx = cw + (1 - cw) * e; kz = cd + (1 - cd) * e; ky = ch + (1 - ch) * e;
      vis = kx; visY = ch + (1 - ch) * backOut(ph.u);
    } else if (ph.st === 'wilt') {
      const e = smooth(ph.u);
      ky = Math.max(0.02, 1 - e); visY = ky; brown = Math.min(1, ph.u * 1.6);
    } else if (ph.st !== 'stand') { p.k = 0; return; }
    const top0 = p.top;
    p.k = ky; p.top = p.y + p.h * ky;
    _v.set(p.x, p.y + (p.h * ky) / 2, p.z);
    G.level.moveDynamic(p.block, _v, _v2.set(p.hw * kx, (p.h * ky) / 2, p.hd * kz), p.yaw);
    if (p.look) {
      const sx = ph.st === 'grow' ? vis : 1, sz = ph.st === 'grow' ? kz : 1;
      p.look.root.scale.set(sx, Math.max(0.02, visY), sz);
      p.brown = brown;
    }
    if (ph.st === 'grow' || (ph.st === 'stand' && ph.u * T.last < 0.1)) this._shove(p, kx, ky, kz);
    if (ph.st === 'wilt' && dt > 0) this._carry(p, p.top - top0);
  }

  // this client's squidkids where the hedge is growing: out of its way, to the nearest side they fit on
  _shove(p, kx, ky, kz) {
    for (const a of this.match.actors) {
      if (!shovable(a) || !this._inBox(p, a, kx, ky, kz, 0)) continue;
      // (standing on it already — it grew under a hop — rides up instead)
      if (a.pos.y > p.y + p.h * ky - 0.3 && a.vel.y <= 0) { a.pos.y = p.y + p.h * ky + 0.01; continue; }
      const sp = this._escapes(p, a, Math.max(kx, kz));
      if (shoveActor(a, sp) >= 0) this.stats.shoved++;
    }
  }
  // anyone standing on a wilting hedge goes down with it (never dropped through it, never pushed into anything)
  _carry(p, dy) {
    if (dy >= 0) return;
    for (const a of this.match.actors) {
      if (!a.alive || a.remote || a.superJumpState) continue;
      const on = a.grounded && a.ground && a.ground.block === p.block.id;
      if (!on) continue;
      a.pos.y += dy;
      if (a.vel.y > 0) a.vel.y = 0;
      this.stats.carried++;
    }
  }

  _navMark() {
    const blk = this.blk;
    if (!blk) return;
    blk.fill(0);
    for (const p of this.pods) if (p.block && p.block.solid) for (const id of p.nav) blk[id] = 1;
    navCommit(this.match.actors);
  }

  // ---- ink (Paint.splat forwards every splat): the meters of the dormant pods it reaches, the hedges' own ink
  onSplat(center, radius, team, opts = {}) {
    if (team !== 0 && team !== 1) return;
    const t = this.clock.t;
    for (const p of this.pods) {
      if (p.off) continue;
      const dx = center.x - p.x, dz = center.z - p.z, reach = radius + Math.max(p.w, p.d) + 0.5;
      if (dx > reach || dx < -reach || dz > reach || dz < -reach) continue;
      if (p.state === 'dormant') {
        if (p.meter[team] >= 1) continue;
        // (the catch: a column over the planter up to the bulb's top — the distance from the splat's centre to it)
        const top = p.y + p.def.bulbY + PODS.bulbH, dy = center.y > top ? center.y - top : center.y < p.y ? p.y - center.y : 0;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const cov = coverFrac(radius, PODS.catchR, d);
        if (cov <= 0) continue;
        const amt = (cov * radius * radius * (opts.pod ?? 1)) / PODS.need;
        p.meter[team] = Math.min(1, p.meter[team] + amt);
        p.inkT[team] = t;
        if (p.meter[team] >= 1 && p.fullT[team] < 0) p.fullT[team] = t;
        if (t - p.rustleT > 0.11 && !this.match.attract) {
          p.rustleT = t;
          G.audio?.play?.('pod_rustle', { pos: _v.set(p.x, p.y + 0.5, p.z), volume: 0.35 + 0.4 * Math.min(1, amt * 4), pitch: 0.85 + 0.5 * p.meter[team] });
        }
      } else if (p.paint && (p.state === 'stand' || p.state === 'wilt')) p.paint.splat(center, radius, team, opts);
    }
  }

  // ---- the looks: bulbs swell / blush / glow with the meters; hedges tinted, browning as they wilt; new ink shown
  _looks(dt) {
    const L = this.looks, time = G.time || 0;
    for (const p of this.pods) {
      if (L) {
        if (p.state === 'dormant' || p.state === 'recharge') {
          const m0 = p.meter[0], m1 = p.meter[1], lead = m0 === m1 ? -1 : m0 > m1 ? 0 : 1, mx = Math.max(m0, m1), mn = Math.min(m0, m1);
          const back = p.state === 'recharge' ? smooth(clamp(this._phase(p, this.clock.t).u, 0, 1)) : 1;   // (regrowing after a wilt)
          const pulse = mx > 0.75 ? 0.5 + 0.5 * Math.sin(time * (8 + 10 * mx)) : 0;
          const k = lead < 0 ? 0 : PODS.blush * clamp((mx - mn) * 1.4 + mx * 0.25, 0, 1);
          L.set(p.i, mx, lead, k, lead < 0 ? 0 : (0.08 + 0.55 * Math.pow(mx, 1.5) + 0.25 * pulse) * back, true, 0.2 + 0.8 * back);
        } else L.set(p.i, 0, -1, 0, 0, false);
      }
      if (p.owner >= 0 && p.block.solid) {
        this._hedge(p);                                 // (a palette change rebuilds its looks)
        this._tintHedge(p);
        if (p.paint && p.paint.dirty) { p.paint.texture.needsUpdate = true; p.paint.dirty = false; }
      }
    }
  }
  // the grower's look: its ink is in the look (built with `tint`); here a sheen of it, browning as it wilts
  _tintHedge(p) {
    const h = p.look;
    if (!h || p.owner < 0) return;
    const col = G.teamColors ? G.teamColors[p.owner] : null, br = p.brown || 0;
    for (const { m, kind } of h.mats[p.owner]) {
      m.color.copy(m.userData.c0);
      if (br > 0) m.color.lerp(BROWN, br * 0.7);
      if (m.emissive) { if (col) m.emissive.copy(col).multiplyScalar((kind === 'leaf' ? PODS.sheen : 0.3) * (1 - br)); else m.emissive.setRGB(0, 0, 0); }
    }
  }

  // ---- Boss Battle: HULLBREAKER walking (not charging) into a standing hedge tramples it (the host decides)
  bossStep() {
    const B = G.boss;
    if (!B || B.dead || this.follower || !B.sim) return;
    const charging = B.move && B.move.id === 'charge';
    if (charging) return;
    for (const p of this.pods) if ((p.state === 'stand') && this._bossIn(p, B, -0.3)) this.wilt(p, this.clock.t);
  }

  // ---- online: a follower replays the host's records (netmatch 'pd', on the host's event timeline)
  netEvent(e) {
    if (!Array.isArray(e) || !this.follower) return;
    const p = this.pods[e[1]];
    switch (e[0]) {
      case 'g': if (p && !p.off) this.grow(p, e[2], e[3]); break;
      case 'w': if (p) { p.wiltAt = e[2]; } break;
      case 'm': for (let i = 0; i < this.pods.length; i++) {
        const q = this.pods[i];
        if (q.state !== 'dormant') continue;
        const a0 = e[1 + i * 2], a1 = e[2 + i * 2];
        if (a0 !== undefined) q.meter[0] = Math.min(0.999, a0 / 100);
        if (a1 !== undefined) q.meter[1] = Math.min(0.999, a1 / 100);
      } break;
    }
  }

  // practice: start over
  reset() {
    for (const p of this.pods) { p.owner = -1; p.meter[0] = p.meter[1] = 0; p.fullT[0] = p.fullT[1] = -1; p.held = ''; this._enter(p, 'dormant', this.clock.t); }
    this._navMark();
  }

  // the pod whose hedge actor a stands on (or null)
  hedgeUnder(a) {
    if (!a.grounded || !a.ground) return null;
    for (const p of this.pods) if (p.block && p.block.solid && a.ground.block === p.block.id) return p;
    return null;
  }

  // snapshot for tests / the HUD
  state() {
    return { t: +this.clock.t.toFixed(3), pods: this.pods.map((p) => ({ id: p.id, state: p.state, owner: p.owner, meter: [+p.meter[0].toFixed(3), +p.meter[1].toFixed(3)],
      held: p.held, off: p.off, k: +p.k.toFixed(3), top: +p.top.toFixed(3), solid: !!(p.block && p.block.solid), t0: +p.t0.toFixed(3), wiltAt: +p.wiltAt.toFixed(3) })),
      blocked: this.blk ? this.blk.reduce((s, v) => s + v, 0) : 0, stats: { ...this.stats } };
  }

  dispose() {
    for (const p of this.pods) {
      if (p.inkMesh) { p.inkMesh.removeFromParent(); p.inkMesh.geometry.dispose(); p.inkMesh.material.dispose(); }
      p.paint?.dispose();
      p.look = null;
    }
    this.looks?.reset();
    this.leaves?.dispose();
    if (this.bossNav && this.bossNav.dynWall) this.bossNav.dynWall = null;
    navRelease(this);
    G.level?.clearDynamic?.();
  }

  // ============================================================================================ bots
  // Called by BotBrain.update every frame (after its own fight / paint / threat logic): may take over the move, the
  // trigger and the aim. Returns an aim ({ yaw, pitch, dist }) to hold, or null. State lives in brain.podS.
  bot(b, dt, it, move, vis) {
    const a = b.a, S = b.podS || (b.podS = { task: null, p: null, t0: 0, next: 0, press: false, face: 1, u: 0, lostT: 0 });
    if (!a.alive || a.superJumpState || (a.specialActive && a.specialActive.body)) { S.task = null; return null; }
    if (this.match.tower && b.tRole === 'ride') { S.task = null; return null; }   // (a tower rider's job is the tower)
    const top = this.hedgeUnder(a);
    if (top) return this._botTop(b, S, top, dt, it, move, vis);
    if (S.task === 'top') S.task = null;
    if (S.task && !this._botValid(b, S)) { S.task = null; S.next = b.t + 1.5; }
    if (!S.task && b.t >= S.next) { S.next = b.t + 0.45 + Math.random() * 0.2; this._botPick(b, S); }
    if (S.task === 'grow') return this._botGrow(b, S, dt, it, move);
    if (S.task === 'cover') return this._botCover(b, S, dt, it, move, vis);
    if (S.task === 'climb') return this._botClimb(b, S, dt, it, move);
    return null;
  }
  _settle(b) { b.wiggleT = 0; b._needJump = false; b.noProg = 0; b.dispT = 0; b.moveAcc = 0; b.snap.copy(b.a.pos); }
  // the move is ours for now: no route (its climb edges / waypoints would pull the other way), re-planned after
  _own(b) { this._settle(b); b.path = null; b.repath = Math.max(b.repath, 0.3); b.navBack = null; }
  _botValid(b, S) {
    const p = S.p;
    if (!p || p.off || b.t - S.t0 > (S.task === 'cover' ? 12 : 10)) return false;
    if (S.task === 'grow') return p.state === 'dormant' && !!b.target && b.a.ink > PLAYER.inkMax * 0.08;
    if (S.task === 'cover') return (p.state === 'grow' || p.state === 'stand') && !!b.target;
    if (S.task === 'climb') return p.state === 'stand' && p.owner === b.a.team && (p.wiltAt - this.clock.t) > 4 && b.mode !== 'retreat';
    return false;
  }
  // what to do near here: our hedge to climb or hide behind, else a pod to grow between us and a foe
  _botPick(b, S) {
    const a = b.a, tv = b.target ? b.tv : null, range = b._range(), melee = range < 6;
    const fighting = b.mode === 'fight' && tv;
    const zoneGuard = !fighting && this.match.zones && (b.zRole === 'guard' || b.zRole === 'watch');
    if (!fighting && !zoneGuard) return;
    let best = null, bs = -Infinity, task = null;
    for (const p of this.pods) {
      if (p.off) continue;
      const dp = Math.hypot(p.x - a.pos.x, p.z - a.pos.z);
      if (dp > 11 || Math.abs(p.y - a.pos.y) > 1.5) continue;
      if (p.state === 'stand' && p.owner === a.team && p.wiltAt - this.clock.t > 6) {
        // our hedge: its top over a fight across open ground (not for close-range kits), or over the zone we guard
        const high = !melee && a.hp > PLAYER.hp * 0.45 && (fighting ? Math.hypot(tv.pos.x - p.x, tv.pos.z - p.z) > 6 && tv.pos.y < p.y + p.h - 0.3 : this._nearZone(p) < 6);
        if (high && dp < 8) { const sc = 10 - dp + (fighting ? 0 : 2); if (sc > bs) { bs = sc; best = p; task = 'climb'; } }
        else if (fighting && this._between(p, a.pos, tv.pos, 0.3)) { const sc = 6 - dp; if (sc > bs) { bs = sc; best = p; task = 'cover'; } }
        continue;
      }
      if (!fighting || p.state !== 'dormant' || p.meter[1 - a.team] >= 1) continue;
      if (dp < 1.6 || dp > Math.min(Math.max(range * 0.95, a.weapon.kind === 'roller' ? 6.5 : 0), 10) || this._inBox(p, a, 1, 1, 1, 0.3)) continue;
      // between us and the target (or another foe we know of: a flank), and nearer us than them
      let hit = false;
      for (const k of b.sight.mem.values()) {
        if (!k.e.alive || (!k.seen && G.time - k.t > 6)) continue;
        const fp = k === b.tk ? tv.pos : k.pos;
        if (Math.hypot(fp.x - a.pos.x, fp.z - a.pos.z) > 22 || Math.hypot(fp.x - p.x, fp.z - p.z) < dp) continue;
        if (this._between(p, a.pos, fp, 0.8)) { hit = true; break; }   // (near enough: it's a wall 3 m wide)
      }
      if (!hit) continue;
      if (!this._seesPod(a, p)) continue;
      const sc = 8 - dp * 0.5 + p.meter[a.team] * 4;
      if (sc > bs) { bs = sc; best = p; task = 'grow'; }
    }
    if (!best || (task === 'grow' && Math.random() < 0.15)) return;
    S.task = task; S.p = best; S.t0 = b.t; S.lostT = 0;
    if (task === 'climb') {
      // the long face toward us, the column in front of us
      const dx = a.pos.x - best.x, dz = a.pos.z - best.z, lz = dx * best.s + dz * best.c, lx = dx * best.c - dz * best.s;
      S.face = lz >= 0 ? 1 : -1; S.u = clamp(lx, -best.w / 2 + 0.45, best.w / 2 - 0.45); S.swimT = 0; S.letGo = 0;
    }
  }
  // a clear shot at the bulb from a's eyes (whatever the ray meets within the pod's own catch doesn't count)
  _seesPod(a, p) {
    _v.set(a.pos.x, a.pos.y + 1.1, a.pos.z); _v2.set(p.x, p.y + p.def.bulbY + 0.15, p.z).sub(_v);
    const len = _v2.length(); _v2.multiplyScalar(1 / len);
    const h = G.physics.raycast(_v, _v2, len, this._hit || (this._hit = new Hit()), true);
    return !h.hit || h.dist > len - PODS.catchR - 0.35;
  }
  _nearZone(p) {
    const Z = this.match.zones;
    if (!Z || !Z.active) return Infinity;
    let best = Infinity;
    for (const z of Z.active.zones) if (z.center) best = Math.min(best, Math.hypot(z.center[0] - p.x, z.center[2] - p.z) - (z.radius || 5));
    return best;
  }
  // does the hedge's footprint (+ pad) cross the line from a to b?
  _between(p, A, Bp, pad) {
    const hx = p.w / 2 + pad, hz = p.d / 2 + pad;
    const la = (x, z) => [(x - p.x) * p.c - (z - p.z) * p.s, (x - p.x) * p.s + (z - p.z) * p.c];
    const [x0, z0] = la(A.x, A.z), [x1, z1] = la(Bp.x, Bp.z);
    let t0 = 0, t1 = 1;
    const dx = x1 - x0, dz = z1 - z0;
    for (const [q, d, lo, hi] of [[x0, dx, -hx, hx], [z0, dz, -hz, hz]]) {
      if (Math.abs(d) < 1e-9) { if (q < lo || q > hi) return false; continue; }
      let a0 = (lo - q) / d, a1 = (hi - q) / d;
      if (a0 > a1) { const tt = a0; a0 = a1; a1 = tt; }
      t0 = Math.max(t0, a0); t1 = Math.min(t1, a1);
      if (t0 > t1) return false;
    }
    return true;
  }
  _aimAt(a, x, y, z) {
    const dx = x - a.pos.x, dz = z - a.pos.z, hd = Math.max(0.4, Math.hypot(dx, dz)), dy = y - (a.pos.y + 1.1);
    return { yaw: Math.atan2(dx, dz), pitch: Math.atan2(dy, hd), dist: Math.hypot(hd, dy) };
  }
  // the weapon's own rhythm: charge-and-release, press-and-release (flicks / cuts / punches), a steady stream
  _trigger(b, S, aimed) {
    const a = b.a, w = a.weapon, wr = a.weaponRunner, kind = w.kind;
    if (!aimed) return wr.charging;       // (keep a charge while turning onto it)
    if (kind === 'charger' || kind === 'bow') return !(wr.charging && wr.charge >= 0.92);
    if (kind === 'spinner' || kind === 'splatling') return wr.burstT <= 0 && !wr.streaming && !(wr.charging && wr.charge >= 0.8);
    if (kind === 'roller' || kind === 'brush' || kind === 'blade') { S.press = !S.press; return S.press; }
    return true;
  }
  // grow cover: stand off, aim at the bulb, ink it full
  _botGrow(b, S, dt, it, move) {
    const a = b.a, p = S.p, dp = Math.hypot(p.x - a.pos.x, p.z - a.pos.z), range = b._range();
    // (a roller flicks at the planter's foot: the sheet comes down flat on it)
    const aim = this._aimAt(a, p.x, p.y + (a.weapon.kind === 'roller' ? 0.1 : p.def.bulbY + 0.15), p.z);
    const aimed = Math.abs(angleDiff(b.aimYaw, aim.yaw)) < Math.max(0.05, Math.atan2(0.3, dp)) && Math.abs(b.aimPitch - aim.pitch) < 0.12;
    it.squid = false; it.sub = false;
    it.fire = this._trigger(b, S, aimed);
    const nx = (p.x - a.pos.x) / (dp || 1), nz = (p.z - a.pos.z) / (dp || 1);
    const want = a.weapon.kind === 'roller' ? 5.4 : Math.min(range * 0.6, 5);    // (a flick comes down ~5 m out)
    if (dp > want + 1) move.set(nx, 0, nz);
    else if (dp < 2.2) move.set(-nx, 0, -nz);
    else move.multiplyScalar(0.35);        // (keep the duel's footwork, gently)
    this._settle(b);
    return aim;
  }
  // fight from behind it: a spot on its far side from the foe, level with us along it; strafe out past its end to shoot
  _botCover(b, S, dt, it, move, vis) {
    const a = b.a, p = S.p, tv = b.tv;
    if (!tv) return null;
    const fl = (tv.pos.x - p.x) * p.s + (tv.pos.z - p.z) * p.c, side = fl >= 0 ? -1 : 1;
    const lx = clamp((a.pos.x - p.x) * p.c - (a.pos.z - p.z) * p.s, -p.w / 2 + 0.4, p.w / 2 - 0.4);
    const ox = lx + (vis ? b.strafeS * 1.2 : 0), oz = side * (p.d / 2 + 0.95);
    const sx = p.x + ox * p.c + oz * p.s, sz = p.z - ox * p.s + oz * p.c;
    const gx = sx - a.pos.x, gz = sz - a.pos.z, gl = Math.hypot(gx, gz);
    if (gl > 6 || !b._fatLos(a.pos.x, a.pos.y, a.pos.z, sx, a.pos.y, sz)) { if (gl > 1.2) return null; }
    if (gl > 0.25) { const k = Math.min(1, gl / 0.6 + 0.2); move.set((gx / gl) * k, 0, (gz / gl) * k); } else move.set(0, 0, 0);
    this._own(b);
    return null;
  }
  // on up our hedge: stand 1.2 m out in front of a column of its long face, ink it bottom to top, swim up it
  _botClimb(b, S, dt, it, move) {
    const a = b.a, p = S.p, f = S.face;
    const nx = f * p.s, nz = f * p.c;             // the face's outward normal (local ±z)
    const cx = p.x + S.u * p.c + f * p.hd * p.s, cz = p.z - S.u * p.s + f * p.hd * p.c;   // the column's foot
    if (a.climbing) {
      it.squid = true; it.fire = false; it.jump = false; it.sub = false; b._bombAim = false;
      move.set(-a.wallN.x, 0, -a.wallN.z);
      this._own(b);
      return null;
    }
    // popping over its top: onto its middle line and stop there (it's only ~0.9 m deep: the pop's carry would take us
    // over the far side)
    if (!a.grounded && a.pos.y > p.y + p.h * 0.6 && this._rectDist(p, a.pos.x, a.pos.z) < 1.2) {
      it.squid = false; it.fire = false; it.jump = false;
      const lz = (a.pos.x - p.x) * p.s + (a.pos.z - p.z) * p.c, k = clamp(-lz / 0.35, -1, 1);
      move.set(p.s * k, 0, p.c * k);
      this._own(b);
      return null;
    }
    const sx = cx + nx * 1.2, sz = cz + nz * 1.2, gx = sx - a.pos.x, gz = sz - a.pos.z, gl = Math.hypot(gx, gz);
    if (gl > 7 || (gl > 1.5 && !b._fatLos(a.pos.x, a.pos.y, a.pos.z, sx, a.pos.y, sz))) { S.task = null; S.next = b.t + 4; return null; }
    // in front of the column: level with it along the face, 0.3–2.1 m out (a squid swimming in stays "in position")
    const lat = (a.pos.x - p.x) * p.c - (a.pos.z - p.z) * p.s, out = f * ((a.pos.x - p.x) * p.s + (a.pos.z - p.z) * p.c) - p.hd;
    const inPos = Math.abs(lat - S.u) < 0.5 && out > 0.3 && out < 2.1 && Math.abs(a.pos.y - p.y) < 0.5;
    const gap = inPos ? this._colGap(p, S, a.team) : 0;
    S.at = { gl, inPos, gap };            // (tests)
    if (inPos && gap === null && b.t >= (S.letGo || 0)) {
      it.squid = true; it.fire = false; it.jump = false; it.sub = false; b._bombAim = false;
      move.set(-nx, 0, -nz);
      if ((S.swimT = (S.swimT || 0) + dt) > 1.8) { S.swimT = 0; S.letGo = b.t + 0.8; }
      this._own(b);
      return null;
    }
    S.swimT = 0;
    it.squid = false;
    if (gl > 0.2) { const k = Math.min(1, gl / 0.8 + 0.2); move.set((gx / gl) * k, 0, (gz / gl) * k); } else move.set(0, 0, 0);
    this._own(b);
    if (!inPos || gap === null || a.ink < PLAYER.inkMax * 0.04) { it.fire = false; return null; }
    const aim = this._aimAt(a, cx, p.y + gap + 0.15, cz);
    const aimed = Math.abs(angleDiff(b.aimYaw, aim.yaw)) < 0.12 && Math.abs(b.aimPitch - aim.pitch) < 0.12;
    it.fire = this._trigger(b, S, aimed);
    return aim;
  }
  // the lowest height on the column that isn't our ink yet (null: ours to the top)
  _colGap(p, S, team) {
    if (!p.paint) return null;
    const f = S.face, nx = f * p.s, nz = f * p.c;
    for (let y = 0.15; y < p.h - 0.05; y += 0.2) {
      const ok = [-0.2, 0, 0.2].every((o) => {
        const lx = S.u + o, wx = p.x + lx * p.c + f * p.hd * p.s, wz = p.z - lx * p.s + f * p.hd * p.c;
        return p.paint.wallTeam(_v.set(wx, p.y + y, wz), _v2.set(nx, 0, nz)) === team + 1;
      });
      if (!ok) return y;
    }
    return null;
  }
  // on top: hold the middle of it, strafe along it in a duel, hide in our ink on it when hurt, ink it when there's
  // nothing to shoot; off the back when there's nothing left to do up there
  _botTop(b, S, p, dt, it, move, vis) {
    const a = b.a;
    if (S.task !== 'top') { S.task = 'top'; S.p = p; S.t0 = b.t; S.lostT = 0; }
    it.jump = false;
    S.lostT = b.target ? 0 : S.lostT + dt;
    const lx = (a.pos.x - p.x) * p.c - (a.pos.z - p.z) * p.s, lz = (a.pos.x - p.x) * p.s + (a.pos.z - p.z) * p.c;
    const leave = (S.lostT > 5 && !(this.match.zones && (b.zRole === 'guard' || b.zRole === 'watch'))) || b.mode === 'retreat' || b.mode === 'refill' && a.ink < PLAYER.inkMax * 0.05;
    if (leave) {
      // off the side away from the foe (or the one nearer us)
      const tv = b.tv, fl = tv ? (tv.pos.x - p.x) * p.s + (tv.pos.z - p.z) * p.c : -lz, side = fl >= 0 ? -1 : 1;
      move.set(side * p.s, 0, side * p.c);
      it.squid = false;
      this._own(b);
      if (b.mode === 'retreat') it.fire = false;
      return null;
    }
    const want = clamp(lx + (vis ? b.strafeS * 0.8 : 0), -p.w / 2 + 0.4, p.w / 2 - 0.4);
    const ex = want - lx, ez = -lz;
    const gx = ex * p.c + ez * p.s, gz = -ex * p.s + ez * p.c, gl = Math.hypot(gx, gz);
    if (gl > 0.12) { const k = Math.min(0.8, gl / 0.5); move.set((gx / gl) * k, 0, (gz / gl) * k); } else move.set(0, 0, 0);
    const hp = a.hp / PLAYER.hp;
    it.squid = a.groundTeam === 1 && (hp < 0.45 || (!vis && a.ink < PLAYER.inkMax * 0.4));
    if (it.squid) { it.fire = false; move.set(0, 0, 0); }
    this._own(b);
    // nothing to shoot: ink the top round our feet (to hide and refill in)
    if (!vis && !it.squid && a.groundTeam !== 1 && a.ink > PLAYER.inkMax * 0.15) {
      it.fire = true;
      return { yaw: b.aimYaw, pitch: -1.0, dist: 1.6 };
    }
    return null;
  }
}

// ------------------------------------------------------------------------------------------------ leaves
// A puff of leaves when a hedge bursts out (and a few brown ones as it wilts): one instanced mesh of small leaf cards
class LeafPuffs {
  constructor(scene) {
    const N = (this.N = 240);
    const g = new THREE.BufferGeometry();
    // a pointed leaf (two triangles either side of a midrib, a slight fold)
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.07, 0.035, 0.006, 0, 0, 0, 0.07, -0.035, 0.006, 0], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals();
    this.mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, side: THREE.DoubleSide });
    this.mesh = new THREE.InstancedMesh(g, this.mat, N);
    this.mesh.frustumCulled = false; this.mesh.name = 'pod-leaves'; this.mesh.count = 0;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.p = Array.from({ length: N }, () => ({ on: false, pos: new THREE.Vector3(), vel: new THREE.Vector3(), rot: new THREE.Euler(), spin: new THREE.Vector3(), life: 0, t: 0, s: 1 }));
    this.next = 0;
    for (let i = 0; i < N; i++) this.mesh.setColorAt(i, _c.set(0x5ba257));
    scene.add(this.mesh);
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._s = new THREE.Vector3();
  }
  puff(p, team, n, dry = false) {
    const col = team >= 0 && G.teamColors ? G.teamColors[team] : null;
    for (let k = 0; k < n; k++) {
      const idx = this.next, L = this.p[idx]; this.next = (this.next + 1) % this.N;
      const lx = (Math.random() - 0.5) * p.w, lz = (Math.random() - 0.5) * p.d, ly = Math.random() * p.h * (dry ? 1 : 0.8);
      L.pos.set(p.x + lx * p.c + lz * p.s, p.y + ly + 0.1, p.z - lx * p.s + lz * p.c);
      const out = dry ? 0.6 : 2.2 + Math.random() * 2.2;
      const ox = lx / (p.w / 2 || 1) + (Math.random() - 0.5), oz = (lz / (p.d / 2 || 1)) * 1.6 + (Math.random() - 0.5);
      const wx = ox * p.c + oz * p.s, wz = -ox * p.s + oz * p.c, wl = Math.hypot(wx, wz) || 1;
      L.vel.set((wx / wl) * out, dry ? 0.3 : 2.5 + Math.random() * 3.5, (wz / wl) * out);
      L.rot.set(Math.random() * TAU, Math.random() * TAU, Math.random() * TAU);
      L.spin.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14);
      L.life = dry ? 1.6 + Math.random() : 1.1 + Math.random() * 0.8; L.t = 0; L.on = true; L.s = 0.8 + Math.random() * 0.8;
      _c.set(dry ? '#9a7a45' : ['#5ba257', '#8fc46b', '#3f8249'][k % 3]);
      if (col && !dry && k % 4 === 0) _c.lerp(_c2.copy(col), 0.6);        // (a few petals in the grower's ink)
      this.mesh.setColorAt(idx, _c);
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
  update(dt) {
    let n = 0;
    const m = this._m, q = this._q, s = this._s;
    for (let i = 0; i < this.N; i++) {
      const L = this.p[i];
      if (!L.on) continue;
      L.t += dt;
      if (L.t >= L.life) { L.on = false; continue; }
      L.vel.y -= 5.5 * dt; L.vel.multiplyScalar(1 - Math.min(0.9, 2.2 * dt));
      L.vel.x += Math.sin(L.t * 7 + i) * 0.6 * dt; L.vel.z += Math.cos(L.t * 6 + i * 1.3) * 0.6 * dt;   // (flutter)
      L.pos.addScaledVector(L.vel, dt);
      L.rot.x += L.spin.x * dt; L.rot.y += L.spin.y * dt; L.rot.z += L.spin.z * dt;
      const k = L.s * Math.min(1, (L.life - L.t) / 0.35);
      m.compose(L.pos, q.setFromEuler(L.rot), s.set(k, k, k));
      this.mesh.setMatrixAt(i, m); n = i + 1;
    }
    this.mesh.count = n;
    // (dead slots below n render at zero scale)
    for (let i = 0; i < n; i++) if (!this.p[i].on) { this.mesh.setMatrixAt(i, m.makeScale(0, 0, 0)); }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
  dispose() { this.mesh.removeFromParent(); this.mesh.geometry.dispose(); this.mat.dispose(); this.mesh.dispose?.(); }
}

// ------------------------------------------------------------------------------------------------ sounds
// (synthesised like every other: src/audio/audio.js voices)
// the meter filling: a short leafy rustle (a crackle of noise ticks through a leafy band, a soft swish under it)
if (!SFX.pod_rustle) SFX.pod_rustle = {
  gain: 0.3, max: 4, jitter: 0.1, reverb: 0.06, minGap: 0.05,
  build(v, p) {
    const T = v.t;
    v.nz({ kind: 'pink', f: 2600 * p, f1: 1500 * p, sw: 0.16, q: 1.1, a: 0.012, d: 0.16, peak: 0.5 });
    const cg = v.gain(0, v.out);
    cg.gain.setValueAtTime(0, T); cg.gain.linearRampToValueAtTime(0.7, T + 0.02); cg.gain.linearRampToValueAtTime(0, T + 0.2);
    v.buffer(texture(v.ctx, 'sizzle'), T, T + 0.22, v.filter('bandpass', 3800 * p, 0.9, cg), 0.7 * p);
  },
};
// a hedge bursting out: a soft thump, a rising leafy whoomph, a shower of rustles settling
if (!SFX.pod_grow) SFX.pod_grow = {
  gain: 0.5, max: 3, jitter: 0.05, reverb: 0.18,
  build(v, p) {
    const T = v.t;
    v.tone({ f: 120 * p, f1: 45 * p, sw: 0.22, a: 0.004, d: 0.3, peak: 0.9 });                        // thump
    const g = v.gain(0, v.out), bp = v.filter('bandpass', 260 * p, 0.9, g);                            // whoomph
    bp.frequency.setValueAtTime(260 * p, T); bp.frequency.exponentialRampToValueAtTime(1500 * p, T + 0.28); bp.frequency.exponentialRampToValueAtTime(700 * p, T + 0.6);
    g.gain.setValueAtTime(0, T); g.gain.linearRampToValueAtTime(0.9, T + 0.1); g.gain.linearRampToValueAtTime(0.35, T + 0.35); g.gain.linearRampToValueAtTime(0, T + 0.7);
    v.noise('pink', T, T + 0.72, bp);
    const cg = v.gain(0, v.out);                                                                         // leaves settling
    cg.gain.setValueAtTime(0, T + 0.05); cg.gain.linearRampToValueAtTime(0.6, T + 0.2); cg.gain.linearRampToValueAtTime(0, T + 0.95);
    v.buffer(texture(v.ctx, 'sizzle'), T + 0.05, T + 0.97, v.filter('bandpass', 3200 * p, 0.8, cg), 0.6);
    v.tone({ t: 0.02, type: 'triangle', f: 330 * p, f1: 520 * p, sw: 0.12, a: 0.005, d: 0.12, peak: 0.12 });   // a bright pop on top
  },
};
// a hedge wilting: a dry crackle of twigs and leaves, sinking
if (!SFX.pod_wilt) SFX.pod_wilt = {
  gain: 0.42, max: 3, jitter: 0.06, reverb: 0.12,
  build(v, p) {
    const T = v.t;
    const cg = v.gain(0, v.out);
    cg.gain.setValueAtTime(0, T); cg.gain.linearRampToValueAtTime(0.9, T + 0.08); cg.gain.linearRampToValueAtTime(0.5, T + 0.6); cg.gain.linearRampToValueAtTime(0, T + 1.1);
    const bp = v.filter('bandpass', 2600 * p, 0.7, cg);
    bp.frequency.setValueAtTime(2600 * p, T); bp.frequency.exponentialRampToValueAtTime(1100 * p, T + 1.1);
    v.buffer(texture(v.ctx, 'sizzle'), T, T + 1.12, bp, 0.9);
    for (let i = 0; i < 6; i++) v.nz({ t: v.r(0, 0.8), ft: 'highpass', f: 2500, a: 0.0005, d: v.r(0.008, 0.02), peak: v.r(0.3, 0.6) });   // twig snaps
    v.nz({ kind: 'pink', ft: 'lowpass', f: 900 * p, f1: 250 * p, sw: 0.9, a: 0.05, d: 0.9, peak: 0.35 });                          // settling down
  },
};
