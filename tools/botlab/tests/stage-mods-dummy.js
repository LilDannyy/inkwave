// A test-only stage module (never shipped): registered by tools/botlab/tests/stage-mods.js and net-stagemods.cjs, it
// exercises the stage-module registry (src/game/stageMods.js, docs/STAGE-MODS.md) end to end. A layout carrying
// `dummymod: { … }` switches it on:
//   • a custom block kind ('dummybox', from W.extraColliders) and a block field ('dummyTag', on a layout piece)
//   • one moving collider (a dynamic block whose height is a pure function of the stage clock)
//   • one special nav edge ('dummy') that opens and closes on the clock (open in the first half of every 20 s)
//   • one noPlace disc, one liquid level (a square region, its surface a pure function of the clock)
//   • a level-material extension (a uniform and a chunk), a minimap layer, a HUD object, a prompt
//   • a host-run counter replicated by records (S.rec / netEvent) and carried to a late joiner (netSnapshot / netRestore)
// Every hook call is logged in W.calls / R.calls (the tests read the order).
import * as THREE from 'three';
import { G } from '../../../src/core/ctx.js';
import { registerStageMod } from '../../../src/game/stageMods.js';
import { Level } from '../../../src/world/level.js';

export const DUMMY = {
  // the moving collider: a 2 × 0.4 × 2 m slab at (x, z), its top y(t) = 1.2 + 0.8 sin(t · 0.6)
  lift: { x: -12, z: -20, top: (t) => 1.2 + 0.8 * Math.sin(t * 0.6) },
  // the special edge: from a to b, cost 3 (much less than walking), open while (t mod 20) < 10
  edge: { a: [-16, 0, -30], b: [16, 0, -30], cost: 3, open: (t) => ((t % 20) + 20) % 20 < 10 },
  // no device in this disc
  disc: { x: 8, z: -12, r: 2 },
  // the liquid: x −24…−18, z 0…10, surface L(t) = −0.6 + 0.5 sin(t · 0.25)
  pool: { x0: -24, x1: -18, z0: 0, z1: 10, y: (t) => -0.6 + 0.5 * Math.sin(t * 0.25) },
};

Level.blockField('dummyTag', (b, d) => { b.dummyTag = d.dummyTag; });
Level.blockField('dummy', (b) => { b.dummy = true; });   // (the flag physics.skip names)
// presence: a block that exists only in state 2 of two (an era-like mask); the level's full mask is 3
Level.blockField('dummyState', (b, d, level) => { b.presence = d.dummyState; level.presenceAll = 3; });
Level.blockKind('dummybox', {
  build(b, d) { b.center.set(...d.c); b.half.set(...d.h); b.aligned = true; },
  mirror(d) { return { ...d, c: [-d.c[0], d.c[1], -d.c[2]] }; },
});

class DummyWorld {
  constructor(ctx) {
    this.calls = ['world'];
    this.ctx = ctx; this.data = ctx.data;
    this.uniforms = { uDummyK: { value: 1 } };
    this.disposed = false;
  }
  prop(it) { if (!this.calls.includes('prop')) this.calls.push('prop'); return it.dummyProp ? { ...it, bucketTag: 'dm', bucketVec: [1, 2] } : it; }
  colliders(it, cols) { if (!this.calls.includes('colliders')) this.calls.push('colliders'); return it.dummyProp ? cols.map((c) => ({ ...c, dummyTag: 'prop' })) : cols; }
  extraColliders() { this.calls.push('extraColliders'); return [{ kind: 'dummybox', c: [0, 1, -36], h: [1, 1, 1], dummy: true, dummyTag: 'extra' }]; }
  attachLevel(level) { this.calls.push('attachLevel'); this.level = level; }
  attachPaint(paint) { this.calls.push('attachPaint'); this.paint = paint; }
  levelMaterial({ grate }) { this.calls.push(grate ? 'levelMaterial:grate' : 'levelMaterial'); return { key: 'dummymod', uniforms: this.uniforms, fragFinal: 'outgoingLight *= uDummyK;', fragPars: 'uniform float uDummyK;' }; }
  afterMeshes(o) { this.calls.push('afterMeshes'); this.meshes = o; }
  navEdges(level) { this.calls.push('navEdges'); const E = DUMMY.edge; return [{ a: E.a, b: E.b, cost: E.cost, type: 'dummy', key: 0, len: 32 }]; }
  attachNav(nav) { this.calls.push('attachNav'); this.nav = nav; }
  attachMinimap(mm) { this.calls.push('attachMinimap'); this.mm = mm; }
  attachEnv(env) { this.calls.push('attachEnv'); }
  ready() { this.calls.push('ready'); }
  noPlace(p, r = 0) { const D = DUMMY.disc; return Math.hypot(p.x - D.x, p.z - D.z) < D.r + r; }
  bakeMode(on) { this.calls.push('bakeMode:' + on); }
  dispose() { this.calls.push('dispose'); this.disposed = true; }
}

class DummyRun {
  constructor(m, W, S) {
    this.m = m; this.W = W; this.S = S;
    this.calls = ['match']; this.seeks = []; this.n = 0; this.edgeTypes = ['dummy']; this.drawn = 0; this.disposed = false;
    this.flagFor = new Set(); this.carried = new Set(); this.adopted = []; this.hostChanges = []; this.lastEt = null;
    this.block = null;
  }
  update(dt, t) {
    if (!this.block && G.level) this.block = G.level.addDynamic({ tag: 'dummy:lift' });
    if (this.block) G.level.moveDynamic(this.block, new THREE.Vector3(DUMMY.lift.x, DUMMY.lift.top(t) - 0.2, DUMMY.lift.z), new THREE.Vector3(1, 0.2, 1), 0);
    this.lastT = t;
  }
  lateUpdate() { if (!this.calls.includes('lateUpdate')) this.calls.push('lateUpdate'); }
  seek(t, why) { this.seeks.push([+t.toFixed(2), why]); }
  navEdge(e) { return e.type !== 'dummy' ? 0 : DUMMY.edge.open(this.S.t) ? 0 : Infinity; }
  liquidY(x, z) { const P = DUMMY.pool; return x >= P.x0 && x <= P.x1 && z >= P.z0 && z <= P.z1 ? P.y(this.S.t) : -Infinity; }
  under(p, depth = 0) { const y = this.liquidY(p.x, p.z); return y > -Infinity && p.y < y + 0.15 - depth; }
  // the host bumps the counter; every screen follows its records
  bump() { if (this.m.follower) return false; this.n++; this.S.rec('dummymod', [this.n, +this.S.t.toFixed(2)]); return true; }
  netEvent(d) { this.n = d[0]; this.lastRec = d; }
  netSnapshot() { return { n: this.n }; }
  netRestore(d) { this.n = d.n; this.restored = d; }
  // online: a flag on chosen squidkids (F.stage), the painter's stage time on splats in the pool region
  netFlag(a) { return this.flagFor.has(a.nid); }
  carryRemote(a, flag) { if (flag) this.carried.add(a.nid); else this.carried.delete(a.nid); }
  splatTime(c) { const P = DUMMY.pool; return c.x >= P.x0 && c.x <= P.x1 && c.z >= P.z0 && c.z <= P.z1 ? this.S.t : undefined; }
  onSplat(c, r, team, opts) { if (opts.replay && opts.et !== undefined) this.lastEt = opts.et; }
  adopt(a) { this.adopted.push(a.nid); }
  hostChanged(isHost) { this.hostChanges.push(isHost); }
  drawMap(c, mm, tc) { this.drawn++; mm.toCanvas(DUMMY.lift.x, DUMMY.lift.z, tc); c.fillStyle = '#ff00ff'; c.fillRect(tc.x - 1, tc.y - 1, 3, 3); }
  hud(a) { return { n: this.n }; }
  state() { return { n: this.n, t: +this.S.t.toFixed(3), top: this.block ? +(this.block.center.y + this.block.half.y).toFixed(3) : null, open: DUMMY.edge.open(this.S.t), seeks: this.seeks.map((s) => s[1]),
    carried: [...this.carried], lastEt: this.lastEt, hostChanges: this.hostChanges, follower: !!this.m.follower }; }
  dispose() { this.calls.push('dispose'); this.disposed = true; if (this.block) G.level?.clearDynamic?.(); this.block = null; }
}

registerStageMod({
  key: 'dummymod', order: 90, worldAs: 'dummyWorld', matchAs: 'dummymod', liquid: true,
  world: (ctx) => new DummyWorld(ctx),
  match: (m, W, S) => new DummyRun(m, W, S),
});

// the layout data that switches it on, and a tagged piece (the block field)
export function installDummy(layout, dressing) {
  if (dressing && !dressing.some((it) => it.dummyProp)) dressing.push({ type: 'crates', variant: 0, pos: [20, 0, -20], dummyProp: true, mirror: false });
  layout.dummymod = { on: true };
  if (!layout.single.some((d) => d.dummyTag)) layout.single.push({ kind: 'box', min: [18, 0, -38], max: [20, 0.6, -37], color: '#c0b0a0', pattern: 3, dummyTag: 'piece' },
    // a shared crate with a state-2-only crate pressed against its +x side: the shared face must stay (it shows in state 1)
    { kind: 'box', min: [20, 0, 20], max: [22, 2, 22], color: '#c0b0a0', pattern: 3, dummyTag: 'shared' },
    { kind: 'box', min: [22, 0, 20], max: [24, 2, 22], color: '#b0a090', pattern: 3, dummyTag: 'state2', dummyState: 2 });
  return layout;
}
export function removeDummy(layout, dressing) {
  if (dressing) for (let i = dressing.length - 1; i >= 0; i--) if (dressing[i].dummyProp) dressing.splice(i, 1);
  delete layout.dummymod;
  layout.single = layout.single.filter((d) => !d.dummyTag);
  return layout;
}
