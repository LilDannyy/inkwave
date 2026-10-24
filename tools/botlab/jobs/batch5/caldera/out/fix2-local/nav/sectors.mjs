// outer radius of walkable floor per 10° sector (|z| ≤ 40), like the review's grid.py: cells 1 m, floor = a non-roof,
// non-rail top under the cell centre
const ROOT = '/Users/danielosling/Desktop/1/st-b5-caldera';
const { LAYOUT } = await import('file://' + ROOT + '/src/world/stages/caldera/layout.js');
const { layoutFor } = await import('file://' + ROOT + '/src/world/variants.js');
const { Level } = await import('file://' + ROOT + '/src/world/level.js');
const L = new Level(layoutFor(LAYOUT, 'turf')), ids = [];
const floorAt = (x, z) => { let best = -Infinity, bb = null; for (const id of L.queryBlocks(x - 0.01, z - 0.01, x + 0.01, z + 0.01, ids)) { const b = L.blocks[id]; if (!b.solid) continue; const n = b.axes[1]; if (n.y < 0.5) continue; const ty = b.center.y + n.y * b.half.y, tx = b.center.x + n.x * b.half.y, tz = b.center.z + n.z * b.half.y; const y = ty - (n.x * (x - tx) + n.z * (z - tz)) / n.y; if (y > best && L.pointInBlock(b, { x, y: y - 0.01, z }, 0.001)) { best = y; bb = b; } } return bb && !bb.roof && !bb.rail && best > -0.5 ? best : null; };
const sec = {};
for (let x = -40.5; x <= 40.5; x += 1) for (let z = -40.5; z <= 40.5; z += 1) { if (floorAt(x, z) === null) continue; const a = Math.floor(Math.atan2(z, x) * 180 / Math.PI / 10) * 10, r = Math.hypot(x, z); sec[a] = Math.max(sec[a] || 0, r); }
const order = []; for (let a = -180; a < 180; a += 10) order.push(a);
console.log(order.map((a) => `${a}:${(sec[a] || 0).toFixed(1)}`).join(' '));
// along Alpha's rim, clockwise from the Rim Head (θ −130) to the horn tip (θ 140)
const rim = []; for (let a = -130; a >= -180; a -= 10) rim.push(a); for (let a = 170; a >= 140; a -= 10) rim.push(a);
console.log('Alpha rim (θ sector: max r):', rim.map((a) => `${a}:${(sec[a] || 0).toFixed(1)}`).join('  '));
