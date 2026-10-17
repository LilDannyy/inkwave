// The shape test (scratch): every stage's walkable footprint, rasterised from its own layout at 0.5 m, written as JSON
// for shape-sheet.py, which draws them side by side at the same scale.
//   ERA=1 node --import ./three-hook.mjs shape-sheet.mjs out.json halyard craters spirhalite bluestone
const root = new URL('../../../../../', import.meta.url).pathname;
const { MAP_LAYOUTS } = await import(root + 'src/world/maps.js');
const { Level } = await import(root + 'src/world/level.js');
const THREE = await import('three');
const [outFile, ...ids] = process.argv.slice(2);
const P = new THREE.Vector3(), res = {};
for (const id of ids) {
  const L = MAP_LAYOUTS[id], lvl = new Level(L, []), B = L.bounds, C = 0.5;
  const x0 = Math.floor(B.minX) - 2, z0 = Math.floor(B.minZ) - 2, nx = Math.ceil((B.maxX - B.minX + 4) / C), nz = Math.ceil((B.maxZ - B.minZ + 4) / C);
  const g = new Array(nx * nz).fill(-99);   // walkable top height, −99 = none; −50 = solid / roof (not floor)
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = x0 + (i + 0.5) * C, z = z0 + (j + 0.5) * C;
    let best = -99, any = false;
    for (const idb of lvl.queryBlocks(x - 0.01, z - 0.01, x + 0.01, z + 0.01, [])) {
      const b = lvl.blocks[idb]; if (!b.solid) continue;
      const n = b.axes[1]; if (n.y < 0.5) continue;
      const t = b.center.clone().addScaledVector(n, b.half.y), y = t.y - (n.x * (x - t.x) + n.z * (z - t.z)) / n.y;
      P.set(x, y - 0.01, z); if (!lvl.pointInBlock(b, P, 0.001)) continue;
      if (y < -1.0 || y > 40) continue;
      any = true;
      if (b.roof || b.rail || b.hidden) continue;
      P.set(x, y + 0.6, z); if (lvl.pointInside(P)) continue;
      if (y > best) best = y;
    }
    g[j * nx + i] = best > -99 ? +best.toFixed(2) : any ? -50 : -99;
  }
  res[id] = { x0, z0, nx, nz, C, g };
}
(await import('node:fs')).writeFileSync(outFile, JSON.stringify(res));
console.log('wrote', outFile, Object.keys(res).join(' '));
