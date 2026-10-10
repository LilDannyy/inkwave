// Bluestone Junction — the era tags and the audit option (pure data: imported by layout.js and props.js, Node-safe,
// no three).
//
// Every era piece carries the era engine's own tags (tools/botlab/jobs/batch5/stages/bluestone/ENGINE.md §3.1, §3.3):
//   eras:     '1' | '12' | '2' | '23' | '3'   (the eras the piece exists in; no tag = all three, mask 7; '13' is illegal)
//   eraGroup: '<name>'                        (the pieces that switch together; keyed per half by the engine)
// The era engine (src/game/eras.js) takes the UNION of every era's pieces: the layout and the dressing hold all three
// eras at once and the engine switches them at the front, so the stage is always built whole (ERA_DEFAULT 'all').
//
// The audit option (ENGINE.md §3.2, T3): ?era=1|2|3 (botlab harnesses: PAGEQ='era=2') makes the engine START the match
// in that era and NEVER jump (pictures, cover maps, spawn → mid, tower checks per era). It no longer filters the layout.
// Node tools that want one era's pieces only call eraFilter(list, e) with an explicit e (build/check-maps.mjs builds
// each era itself: src/world/eras-data.js).
export const ERA_DEFAULT = 'all';

const MASK = { 1: 1, 12: 3, 2: 2, 23: 6, 3: 4 };
// '1' | '12' | '2' | '23' | '3' | undefined → 1 | 3 | 2 | 6 | 4 | 7 (the engine's eraMask)
export function eraMask(s) {
  if (s === undefined || s === null || s === '' || s === '123') return 7;
  const m = MASK[s];
  if (!m) throw new Error(`bluestone: bad era tag '${s}' (one of '1', '12', '2', '23', '3')`);
  return m;
}

// the audit era from the page's query (?era=1|2|3), or 0 (no audit: the match runs its schedule)
export function auditEra() {
  let v = null;
  try { if (typeof location !== 'undefined' && location.search) v = new URLSearchParams(location.search).get('era'); } catch (e) { v = null; }
  const n = v ? +String(v).trim() : 0;
  return n === 1 || n === 2 || n === 3 ? n : 0;
}
// the layout is always the union (0); kept as a constant for the tools that printed it
export const ERA = 0;
export const ERA_NAMES = ['1880s', 'TODAY', '3000s'];

// does a piece (layout def or dressing item) exist in era e (0 = union: always)
export const inEra = (it, e = ERA) => !e || (eraMask(it.eras) & (1 << (e - 1))) !== 0;
export const eraFilter = (list, e = ERA) => (e ? list.filter((it) => inEra(it, e)) : list);
