// Cover map analysis (scratch):  ERA=n node --import ./three-hook.mjs cover-stretches.mjs page.log [map]
// From cover-map.js's grid (1 m cells, distance to the nearest ≥ 0.9 m cover): the share within 5 m (the tool's own
// number), and every OPEN STRETCH over 10 m — a connected patch of floor cells farther than 5 m from any cover (an open
// circle more than 10 m across) — with its size, centre and the farthest cell, and what that floor is (the tool counts the
// top of a crate or bench as floor too: those are marked "object top", the rest are open ground).
import fs from 'node:fs';
const root = new URL('../../../../../', import.meta.url).pathname;
const [logFile, mapId = 'bluestone'] = process.argv.slice(2);
const info = JSON.parse(/PASS cover map {2}(\{.*\})/.exec(fs.readFileSync(logFile, 'utf8'))[1]);
const { MAP_LAYOUTS } = await import(root + 'src/world/maps.js');
const { Level } = await import(root + 'src/world/level.js');
const THREE = await import('three');
const lvl = new Level(MAP_LAYOUTS[mapId], []), P = new THREE.Vector3();
const g = info.grid, b = Buffer.from(g.b64, 'base64'), D = (i, j) => (b[j * g.nx + i] === 255 ? null : b[j * g.nx + i] / 10);
// the block whose top is the floor at (x, z): its tag and the top's footprint (m²)
const floorOf = (x, z) => {
  let best = -Infinity, bb = null;
  for (const id of lvl.queryBlocks(x - 0.01, z - 0.01, x + 0.01, z + 0.01, [])) {
    const k = lvl.blocks[id]; if (!k.solid || k.rail || k.hidden || k.roof) continue;
    const n = k.axes[1]; if (n.y < 0.5) continue;
    const t = k.center.clone().addScaledVector(n, k.half.y), y = t.y - (n.x * (x - t.x) + n.z * (z - t.z)) / n.y;
    P.set(x, y - 0.01, z); if (y > 30 || y <= best || !lvl.pointInBlock(k, P, 0.001)) continue;
    best = y; bb = k;
  }
  return bb ? { tag: bb.tag, y: +best.toFixed(2), area: 4 * bb.half.x * bb.half.z } : null;
};
// floors that are ground (a slab, a deck, a tier, a stair), not the top of a crate or a planter
const OPEN = /^(spawn-deck|balcony-landing|loading-platform|tram-island|garden-walk|garden-lawn|halo|balcony|gallery|tide-steps|terrace|street|circus|concourse|west-wharf|degrayling|arcade-floor|gpo-terrace|boathouse|boardwalk|iron-bridge|carriageway|kerb|terrace-kerb|grand-stair|side-ramp|clock-steps|concourse-ramp|gpo-steps|gpo-stair|balcony-stair|boathouse-stair|forecourt-steps|halo-stair|garden-stair|light-pylon)$/;
const seen = new Set(), patches = [];
for (let j = 0; j < g.nz; j++) for (let i = 0; i < g.nx; i++) {
  const d = D(i, j); if (d === null || d <= 5 || seen.has(j * g.nx + i)) continue;
  const st = [[i, j]], cells = []; seen.add(j * g.nx + i);
  while (st.length) { const [a, c] = st.pop(); cells.push([a, c]);
    for (const [p, q] of [[a + 1, c], [a - 1, c], [a, c + 1], [a, c - 1]]) { if (p < 0 || q < 0 || p >= g.nx || q >= g.nz || seen.has(q * g.nx + p)) continue; const v = D(p, q); if (v !== null && v > 5) { seen.add(q * g.nx + p); st.push([p, q]); } } }
  const far = cells.reduce((m, c) => (D(...c) > D(...m) ? c : m)), x = g.x0 + far[0] + 0.5, z = g.z0 + far[1] + 0.5, f = floorOf(x, z);
  patches.push({ cells: cells.length, r: D(...far), at: [x, z], floor: f, objectTop: !!(f && f.area < 12 && f.y > 0.25 && !OPEN.test(f.tag || '')) });
}
patches.sort((p, q) => q.r - p.r);
const open = patches.filter((p) => !p.objectTop);
console.log(`${mapId}${process.env.ERA ? ' era ' + process.env.ERA : ''}: ${info.within5m_pct}% of ${info.floorCells} floor cells within 5 m of cover; largest open circle r ${info.largestOpenRadius_m} m at ${JSON.stringify(info.at)}`);
console.log(`  open stretches over 10 m across (cells > 5 m from cover) on open ground: ${open.length} (and ${patches.length - open.length} on object tops, the tool's artefact)`);
for (const p of open) console.log(`   r ${p.r.toFixed(1).padStart(4)} m  ${String(p.cells).padStart(3)} m²  at [${p.at}]  on ${p.floor ? p.floor.tag + ' (y ' + p.floor.y + ')' : '?'}`);
if (process.env.ALL) for (const p of patches.filter((q) => q.objectTop)) console.log(`   (object top) r ${p.r.toFixed(1)} at [${p.at}] on ${p.floor.tag}`);
