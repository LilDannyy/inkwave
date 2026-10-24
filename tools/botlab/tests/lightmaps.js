// [b5-beta1] Lightmaps for every world a player can reach, and the quiet fallback for a mode variant still unbaked.
//   MAP=halyard PAGE=tools/botlab/tests/lightmaps.js tools/botlab/run.sh tools/botlab/page.cjs
// 1. Every stage in MAPS, in every mode it offers (Turf War, Zone Control, Tower Command, Boss Battle unless noBoss), builds
//    its world with the baked lightmap applied (assets/lightmaps/<world key>.json for exactly this build: not missing, not
//    stale). Highmark Foundry shipped with none and Bluestone's Tower Command / Boss Battle variants unbaked (the beta's
//    issue log: "no lightmap for caldera", "… bluestone.tower"). Bazookarp variants are listed, not judged
//    (PAGE_ARGS='karp=1' judges them too).
// 2. A Bazookarp variant with no bake builds unlit with no warning (nothing in the issue log) and one debug line per key
//    for the whole session; a stage's own missing bake still warns.
(async () => {
  const g = window.__inkwave, G = window.__G, out = [], R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const C = await import('./src/config.js');
  const { variantKey } = await import('./src/world/variants.js');
  const { MAP_LAYOUTS } = await import('./src/world/maps.js');
  const { dressingFor } = await import('./src/world/dressing.js');
  const args = String(window.__pageArgs || ''), judgeKarp = /karp=1/.test(args);
  const L0 = window.__issueLog;
  const back = { map: g.mapDef, mode: g.match?.mode || 'turf' };
  g.debug.freeze();   // (worlds are swapped under the harness's match: hold it still)
  const dbg = [], d0 = console.debug; console.debug = (...a) => { dbg.push(a.join(' ')); return d0.apply(console, a); };
  const n0 = L0.snapshot().length;
  const build = async (map, mode) => { g.worldKey = null; await g._buildWorld(map, mode); return G.level; };
  // 1. every reachable world
  const seen = new Map(), bad = [], karp = [];
  for (const map of C.MAPS) {
    const id = map.layout || map.id, modes = ['turf', 'zones', 'tower', ...(C.mapBossOk(map.id) ? ['boss'] : []), ...(MAP_LAYOUTS[id]?.bazookarp ? ['bazookarp'] : [])];
    for (const mode of modes) {
      const key = variantKey(id, MAP_LAYOUTS[id], dressingFor(id), mode);
      if (seen.has(key)) continue;
      const L = await build(map, mode);
      const lit = L.lightSize > 0 && L.faces.some((f) => f.light);
      seen.set(key, lit);
      if (mode === 'bazookarp' && !judgeKarp) { karp.push(key + (lit ? ' lit' : ' unlit')); continue; }
      if (!lit) bad.push(key);
    }
  }
  R('every world a player can reach (each stage, each mode it offers) has its baked lightmap applied', bad.length === 0, { unlit: bad, worlds: seen.size, bazookarpVariants: karp });
  // 2. the quiet fallback: a Bazookarp variant with no bake
  const unbaked = [...seen.entries()].find(([k, lit]) => k.endsWith('.bazookarp') && !lit);
  if (!unbaked) R('quiet fallback: (every Bazookarp variant is baked: nothing to test)', true);
  else {
    const [key] = unbaked, base = key.split('.')[0], map = C.MAPS.find((m) => (m.layout || m.id) === base);
    await build(map, 'turf'); await build(map, 'bazookarp'); await build(map, 'turf'); await build(map, 'bazookarp');   // (built 3 times in all)
    const unlitNow = !(G.level.lightSize > 0);
    const warns = L0.snapshot().slice(n0).filter((e) => /lightmap/.test(e.message || '') && /\.bazookarp/.test(e.message || ''));
    const mine = dbg.filter((l) => l.includes(key));
    R(`unbaked mode variants (${[...seen.entries()].filter(([k, lit]) => k.endsWith('.bazookarp') && !lit).map(([k]) => k).join(', ')}) build unlit with no warning in the issue log`, warns.length === 0 && unlitNow, { warns: warns.map((e) => e.kind + ': ' + e.message) });
    R(`…and one debug line for ${key} in the whole session though it was built 3 times`, mine.length === 1, mine);
    // a stage's own missing bake still warns (a made-up key, on a throwaway world)
    const n1 = L0.snapshot().length;
    await g._loadLightmap(G.level, 'nosuchstage');
    await g._loadLightmap(G.level, 'nosuchstage.tower');
    const w1 = L0.snapshot().slice(n1).filter((e) => e.kind === 'console-warn' && /no lightmap/.test(e.message || ''));
    R('a stage\'s own missing lightmap still warns; a missing mode variant does not', w1.length === 1 && /nosuchstage/.test(w1[0].message) && !/nosuchstage\.tower/.test(w1[0].message), w1.map((e) => e.message));
  }
  console.debug = d0;
  await build(back.map, back.mode);   // (the world the harness started in)
  g.debug.unfreeze();
  return out;
})()
