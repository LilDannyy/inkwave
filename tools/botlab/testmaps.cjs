// Botlab test arenas (never shipped): registered in the game page before a match starts, by page.cjs and match.cjs.
//   testbox — a flat 56 × 96 m deck, spawn steps and one wall (a zipline target)
//   podbox  — the same with sprout pods (src/game/pods.js, mirrored) on their planters (the stage's own, as static
//             boxes): open ground, one hard by the wall, one by the water's edge, one beside the tower track, one on
//             it (off in Tower Command), a calibration range, and one across a dead-end lane (a hedge there cuts the
//             only way in); the tower track runs x = −8 from the centre to z = 32 (tools/botlab/tests/pods.js)
const TEST_MAPS = ['testbox', 'podbox'];
function defineTestMap(MAP) {
  return `(async () => {
    const { MAPS } = await import('./src/config.js'); const { MAP_LAYOUTS } = await import('./src/world/maps.js');
    const id = '${MAP}';
    if (!MAPS.find((m) => m.id === id)) MAPS.push({ id, name: id === 'podbox' ? 'Pod Box' : 'Test Box', blurb: '', theme: 'day', times: { day: 'day', dusk: 'sunset' } });
    const B = (x0, x1, y0, y1, z0, z1, o = {}) => ({ kind: 'box', min: [x0, y0, z0], max: [x1, y1, z1], color: '#d8d2c4', pattern: 3, ...o });
    MAP_LAYOUTS[id] = { id, bounds: { minX: -28, maxX: 28, minZ: -48, maxZ: 48 }, spawnPads: [[0, 2.4, -44], [0, 2.4, 44]], spawnBarrier: 4.2,
      single: [B(-28, 28, -1.2, 0, -40, 40)], half: [B(-8, 8, -1.2, 2.4, -48, -40), B(14, 15, 0, 4, -8, 8)], decor: { lamps: [], palms: [], flags: [] } };
    if (id === 'podbox') {
      const L = MAP_LAYOUTS.podbox;
      // the planters (the stage's own), and the dead-end lane: 4 m wide between walls you can't ink or stand on
      L.half.push(...[[0, -6], [13.1, 0], [27.4, 12], [-6, 14], [-8, 24], [18, -20], [22, -27]].map(([x, z]) =>
        B(x - 0.45, x + 0.45, 0, 0.5, z - 0.45, z + 0.45, { paint: false, color: '#9a948a' })));
      const wall = { paint: false, roof: true, color: '#b9b2a4' };
      L.half.push(B(19.5, 20, 0, 2.6, -36.5, -22, wall), B(24, 24.5, 0, 2.6, -36.5, -22, wall), B(20, 24, 0, 2.6, -36.5, -36, wall));
      Object.assign(L, {
        tower: { path: [[0, 0], [-8, 0], [-8, 32]], checkpoints: [[-8, 16]] },
        pods: { mirror: true, list: [
          { id: 'mid', pos: [0, 0, -6], rotY: 0, size: [3, 1.8, 0.9] },
          { id: 'wall', pos: [13.1, 0, 0], rotY: Math.PI / 2, size: [3, 1.8, 0.9] },
          { id: 'edge', pos: [27.4, 0, 12], rotY: Math.PI / 2, size: [3, 1.8, 0.9] },
          { id: 'track', pos: [-6.0, 0, 14], rotY: Math.PI / 2, size: [3, 1.8, 0.9] },
          { id: 'ontrack', pos: [-8, 0, 24], rotY: 0, size: [3, 1.8, 0.9] },
          { id: 'calib', pos: [18, 0, -20], rotY: 0, size: [3, 1.8, 0.9] },
          { id: 'lane', pos: [22, 0, -27], rotY: 0, size: [4, 1.8, 0.9] },
        ] },
      });
    }
    return true; })()`;
}
module.exports = { TEST_MAPS, defineTestMap };
