// Bluestone Junction — the era tags and the BLOCKOUT's build-time era filter (pure data: imported by layout.js and
// props.js, Node-safe, no three).
//
// Every era piece carries the era engine's own tags (tools/botlab/jobs/batch5/stages/bluestone/ENGINE.md §3.1, §3.3):
//   eras:     '1' | '12' | '2' | '23' | '3'   (the eras the piece exists in; no tag = all three, mask 7; '13' is illegal)
//   eraGroup: '<name>'                        (the pieces that switch together; keyed per half by the engine)
// The era engine (src/game/eras.js, not built yet) will consume the UNION of every era's pieces and switch them at the
// front. Until it exists, the stage cannot hold two eras at once (an era-1 superstop and the era-3 glass stair inside it
// are both solid), so the layout and the dressing are built for ONE era, chosen here:
//   browser / Electron: ?era=1|2|3   (harness: ERA=1|2|3 → tools/botlab/offscreen-boot.cjs adds ?era=)
//   Node (check-maps):  ERA=1|2|3 node build/check-maps.mjs bluestone
//   ?era=all / ERA=all: the union, unfiltered (what the engine will take; not playable without it)
// With no option the stage builds era 1 (every match starts in the 1880s). When the engine lands, ERA_DEFAULT becomes
// 'all' (the engine itself reads ?era= for its audits: start in that era and never jump).
export const ERA_DEFAULT = '1';

const MASK = { 1: 1, 12: 3, 2: 2, 23: 6, 3: 4 };
// '1' | '12' | '2' | '23' | '3' | undefined → 1 | 3 | 2 | 6 | 4 | 7 (the engine's eraMask)
export function eraMask(s) {
  if (s === undefined || s === null || s === '' || s === '123') return 7;
  const m = MASK[s];
  if (!m) throw new Error(`bluestone: bad era tag '${s}' (one of '1', '12', '2', '23', '3')`);
  return m;
}

function readOption() {
  let v = null;
  try { if (typeof location !== 'undefined' && location.search) v = new URLSearchParams(location.search).get('era'); } catch (e) { v = null; }
  try { if (!v && typeof process !== 'undefined' && process.env && process.env.ERA) v = process.env.ERA; } catch (e) { /* (no process in the page) */ }
  v = v ? String(v).trim().toLowerCase() : ERA_DEFAULT;
  if (v === 'all' || v === 'union') return 0;
  const n = +v;
  return n === 1 || n === 2 || n === 3 ? n : +ERA_DEFAULT;
}
// the era this build is for: 1 / 2 / 3, or 0 = the union (no filter)
export const ERA = readOption();
export const ERA_NAMES = ['1880s', 'TODAY', '3000s'];

// does a piece (layout def or dressing item) exist in era e (0 = union: always)
export const inEra = (it, e = ERA) => !e || (eraMask(it.eras) & (1 << (e - 1))) !== 0;
export const eraFilter = (list, e = ERA) => list.filter((it) => inEra(it, e));
