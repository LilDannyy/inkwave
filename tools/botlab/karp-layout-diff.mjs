// [b5-karp] SPEC §10.1's build regressions, without Electron: for every stage, the Turf War, Zone Control, Tower Command
// and Boss Battle builds (variants.js layoutFor: pieces, their count and a hash of every piece) and the stage-card
// thumbnail (mapThumb.js layoutThumbSVG over the raw layout, both themes) on this tree, against another tree's src
// (a base commit unpacked with node_modules linked):
//   git archive <base> src | tar -x -C /tmp/base && ln -s "$PWD/node_modules" /tmp/base/node_modules
//   node tools/botlab/karp-layout-diff.mjs /tmp/base
// Prints one line per stage × build, then RESULT same|differ. (The Bazookarp build itself is new: listed, not compared.)
import { createHash } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const here = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const base = process.argv[2];
if (!base) { console.log('usage: node tools/botlab/karp-layout-diff.mjs <base tree with src/>'); process.exit(2); }
const MODES = ['turf', 'zones', 'tower', 'boss'];
// (a piece's mode filters — onlyIn / notIn — choose which builds it is in; they are not part of what gets built)
const strip = (k, v) => (k === 'onlyIn' || k === 'notIn' ? undefined : v);
const h = (x) => createHash('sha1').update(typeof x === 'string' ? x : JSON.stringify(x, strip)).digest('hex').slice(0, 12);
async function snap(root) {
  const imp = (f) => import(pathToFileURL(path.join(root, 'src', f)).href);
  const { MAP_LAYOUTS } = await imp('world/maps.js');
  const { layoutFor } = await imp('world/variants.js');
  const { layoutThumbSVG } = await imp('world/mapThumb.js');
  const out = {};
  for (const [id, L] of Object.entries(MAP_LAYOUTS)) {
    const row = out[id] = {};
    for (const m of [...MODES, 'bazookarp']) {
      let built = null;
      try { built = layoutFor(L, m); } catch (e) { row[m] = { err: String(e.message || e).slice(0, 80) }; continue; }
      const pieces = [...(built.single || []), ...(built.half || [])];
      row[m] = { n: pieces.length, single: (built.single || []).length, half: (built.half || []).length, hash: h(pieces) };
    }
    row.thumbDay = h(layoutThumbSVG(L, 'day')); row.thumbSunset = h(layoutThumbSVG(L, 'sunset'));
  }
  return out;
}
const [a, b] = [await snap(here), await snap(path.resolve(base))];
let differ = 0, rows = 0;
for (const id of Object.keys(b)) {
  if (!a[id]) { console.log(`${id}: missing on this tree`); differ++; continue; }
  for (const k of [...MODES, 'thumbDay', 'thumbSunset']) {
    rows++;
    const x = JSON.stringify(a[id][k]), y = JSON.stringify(b[id][k]);
    if (x !== y) { differ++; console.log(`DIFFER ${id} ${k}: this ${x} · base ${y}`); }
    else console.log(`same   ${id} ${k}: ${x}`);
  }
  console.log(`info   ${id} bazookarp: ${JSON.stringify(a[id].bazookarp)}`);
}
console.log(`RESULT ${differ ? 'differ' : 'same'} (${rows - differ}/${rows} builds and thumbnails identical)`);
