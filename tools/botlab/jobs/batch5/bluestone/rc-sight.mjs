// Bluestone round C (scratch): "no straight sightline from base to base". Kid eyes (1.5 m over the floor) on a 1 m grid
// over Alpha's spawn deck (3.3) to every eye on Bravo's (its mirror): a line is blocked when it passes through any solid
// that is not see-through (rails, grates and glass rails pass; roofs and hidden colliders block, as walls do). Marches
// each line at 0.25 m.   ERA=1|2|3 node --import ./three-hook.mjs rc-sight.mjs
const root = new URL('../../../../../', import.meta.url).pathname;
const THREE = await import('three');
const { MAP_LAYOUTS } = await import(root + 'src/world/maps.js');
const { layoutFor } = await import(root + 'src/world/variants.js');
const { Level } = await import(root + 'src/world/level.js');
const LY = await import(root + 'src/world/stages/bluestone/layout.js');
const L = new Level(layoutFor(MAP_LAYOUTS.bluestone, 'turf'), []), P = new THREE.Vector3(), ids = [];
const solid = (x, y, z) => { P.set(x, y, z); for (const id of L.queryBlocks(x - 0.01, z - 0.01, x + 0.01, z + 0.01, ids)) { const b = L.blocks[id]; if (b.solid && !b.rail && !b.grate && L.pointInBlock(b, P, 0)) return true; } return false; };
const clear = (a, b) => { const d = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.ceil(d / 0.25); for (let i = 2; i < n - 1; i++) { const t = i / n; if (solid(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t)) return false; } return true; };
const [x0, x1, z0, z1] = LY.P.deck, eye = 3.3 + 1.5, A = [];
for (let x = x0 + 0.5; x < x1; x += 1) for (let z = z0 + 0.5; z < z1; z += 1) A.push([x, eye, z]);
let n = 0, open = 0; const samples = [];
for (const a of A) for (const b of A) { const bb = [-b[0], eye, -b[2]]; n++; if (clear(a, bb)) { open++; if (samples.length < 6) samples.push([a[0], a[2], bb[0], bb[2]]); } }
const pad = [LY.PAD[0], LY.PAD[1] + 1.5, LY.PAD[2]];
console.log(JSON.stringify({ era: process.env.ERA || '1', eyesPerDeck: A.length, lines: n, clearLines: open, clearPct: +(100 * open / n).toFixed(2), padToPadClear: clear(pad, [-pad[0], pad[1], -pad[2]]), samples }));
