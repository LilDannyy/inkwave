// [b5-karp-checker] A test-only stage module (never shipped) that proves the checker's stage states end to end, the way
// bluestone's eras and caldera's lava will plug in (docs/STAGE-MODS.md; SPEC §3.2 step 6, §5.5):
//   • a layout carrying `kcstates: { wall: [x0, x1, z0, z1, h] }` switches it on;
//   • its match runtime offers one extra field state through R.karpStates() → [{ key: 'w', nodeOk, query: 'kcstate=w' }]
//     (G.match.stage.karpStates() asks it): the wall's footprint is taken out of the field in state 'w';
//   • its world reads its own audit switch from the page query (?kcstate=w, as an era module reads ?era=): then the wall
//     stands in the world (a collider on each half, and a mesh to see it by).
// karp-check-box.js's case 'states' registers it; bazookarp-check.cjs then checks state 0 on the page as built and state
// 'w' on a page loaded with the state's query.
import * as THREE from 'three';
import { registerStageMod } from '../../src/game/stageMods.js';

const shown = () => typeof location !== 'undefined' && new URLSearchParams(location.search).get('kcstate') === 'w';
const boxes = (w) => { const [x0, x1, z0, z1, h] = w; return [{ min: [x0, 0, z0], max: [x1, h, z1] }, { min: [-x1, 0, -z1], max: [-x0, h, -z0] }]; };
class KcWorld {
  constructor(ctx) { this.data = ctx.data; }
  extraColliders() { return shown() ? boxes(this.data.wall).map((b) => ({ ...b, roof: true })) : []; }
  afterMeshes({ scene }) {
    if (!shown()) return;
    this.meshes = boxes(this.data.wall).map((b) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]), new THREE.MeshStandardMaterial({ color: '#c0483a' }));
      m.position.set((b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2); scene.add(m); return m;
    });
  }
  dispose() { for (const m of this.meshes || []) { m.parent?.remove(m); m.geometry.dispose(); m.material.dispose(); } }
}
class KcRun {
  constructor(m, W) { this.W = W; }
  karpStates() {
    const inWall = (n) => boxes(this.W.data.wall).some((b) => n.x >= b.min[0] - 0.5 && n.x <= b.max[0] + 0.5 && n.z >= b.min[2] - 0.5 && n.z <= b.max[2] + 0.5 && n.y < b.max[1]);
    const nav = window.__G?.nav;
    return [{ key: 'w', nodeOk: (id) => !inWall(nav.nodes[id]), query: 'kcstate=w' }];
  }
}
let done = false;
export function registerKcStates() {
  if (done) return; done = true;
  registerStageMod({ key: 'kcstates', order: 90, world: (ctx) => new KcWorld(ctx), match: (m, W) => new KcRun(m, W) });
}
