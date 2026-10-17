// Bluestone round C fix 1 (scratch): what the customs dock looks over. Kid eyes (1.5 m over the floor) on a 1 m grid over
// the dock's top (1.2) against the same grid at street level with the dock and its cover taken away (the apron as it was),
// and the apron's open floor in front of the dock: per target region, the share of target points (a kid's chest, 1 m over
// its floor) one eye sees, averaged over the eyes (rails and grates are see-through, as in rc-sight.mjs).
//   ERA=1|2|3 node --import ./three-hook.mjs rcf1-dock-sight.mjs
const root = new URL('../../../../../', import.meta.url).pathname;
const THREE = await import('three');
const { MAP_LAYOUTS } = await import(root + 'src/world/maps.js');
const { layoutFor } = await import(root + 'src/world/variants.js');
const { Level } = await import(root + 'src/world/level.js');
const LY = await import(root + 'src/world/stages/bluestone/layout.js');
const L = new Level(layoutFor(MAP_LAYOUTS.bluestone, 'turf'), []), P = new THREE.Vector3(), ids = [];
const D = LY.DOCK, S2 = Math.SQRT1_2, CH = (a, c) => [-37 + S2 * (a + c), 5 + S2 * (a - c)];
const inDock = (x, z) => { const a = ((x + 37) + (z - 5)) * S2, c = ((x + 37) - (z - 5)) * S2; return a > D.a0 - 0.1 && a < D.a0 + D.len + 0.1 && c > -0.1 && c < D.c0 + D.w + 3.2; };
const solid = (x, y, z, skipDock) => { P.set(x, y, z); for (const id of L.queryBlocks(x - 0.01, z - 0.01, x + 0.01, z + 0.01, ids)) { const b = L.blocks[id]; if (!b.solid || b.rail || b.grate) continue; if (skipDock && inDock(b.center.x, b.center.z) && b.center.z > -1) continue; if (L.pointInBlock(b, P, 0)) return true; } return false; };
const clear = (a, b, skip) => { const d = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.ceil(d / 0.25); for (let i = 1; i < n; i++) { const t = i / n; if (solid(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, skip)) return false; } return true; };
const eyes = { dock: [], apronBefore: [], apronFront: [] };
for (let a = D.a0 + 0.5; a < D.a0 + D.len; a += 1) for (let c = D.c0 + 0.5; c < D.c0 + D.w; c += 1) { const [x, z] = CH(a, c); if (!solid(x, D.y + 0.9, z, false)) eyes.dock.push([x, D.y + 1.5, z]); eyes.apronBefore.push([x, 1.5, z]); }
for (let a = D.a0 + 0.5; a < D.a0 + D.len; a += 1) for (let c = D.c0 + D.w + 0.5; c < D.c0 + D.w + 4.5; c += 1) { const [x, z] = CH(a, c); if (!solid(x, 0.9, z, false) && x > -37 && z > -1.5) eyes.apronFront.push([x, 1.5, z]); }
const regions = { 'circus 9-11 o’clock (x −20…−8, z −6…20, y 0)': [-20, -8, -6, 20, 0], 'enemy Boathouse deck (2.4)': [-21.5, -14.5, 12, 24, 2.4], 'enemy punt landing and north leg (−0.34)': [-14, -11, 20, 32, -0.34], 'cab rank (x −26…−17, z −15…−2, y 0)': [-26, -17, -15, -2, 0], 'the apron itself (y 0)': [-37, -20, -2, 20, 0] };
const TH = +(process.env.TH || 1.0);   // the target's height over its floor: 1.0 a kid's chest, 0.3 a squid in its ink
const out = { era: process.env.ERA || '1', targetHeight: TH, eyes: Object.fromEntries(Object.entries(eyes).map(([k, v]) => [k, v.length])), seen: {} };
for (const [name, [x0, x1, z0, z1, y]] of Object.entries(regions)) {
  const T = []; for (let x = x0 + 0.5; x < x1; x += 1) for (let z = z0 + 0.5; z < z1; z += 1) { if (name.startsWith('the apron') && (inDock(x, z) || x < -37 || z > x + 42)) continue; if (!solid(x, y + 1.0, z, false) && !solid(x, y + 0.3, z, false)) T.push([x, y + TH, z]); }
  const row = { targets: T.length };
  for (const [k, E] of Object.entries(eyes)) { let s = 0; for (const e of E) for (const t of T) if (clear(e, t, k === 'apronBefore')) s++; row[k] = +(s / Math.max(1, T.length * E.length)).toFixed(2); }
  out.seen[name] = row;
}
console.log(JSON.stringify(out, null, 1));
