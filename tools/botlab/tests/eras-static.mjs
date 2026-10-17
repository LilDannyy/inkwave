// Bluestone Junction's era engine — the static rules check-maps' T2 runs (ENGINE.md §3.5, §5), in Node, no Electron:
//   node tools/botlab/tests/eras-static.mjs
// The objective rules (14 spawn pads, 15 zones, 16 the tower's swept volume, 17 the Bazookarp Pond / weirs / Gate), the
// waterline slab (36), the reach (37), the river rails' ends, and the turf rules (11–13) hold on the stage as built, in
// every mode build; and each check FAILS on one planted violation (a piece put where its rule forbids it, a river rail
// cut short, turf numbers out of range), so a later edit that breaks a rule cannot pass check-maps. The final review's
// issue 6 adds Tartar's tower (18), overhead pieces (21–22), their deck edges (23), era-3 heights (26), swaps (29–30) and
// the looks (39), each with its own planted violation.
const { MAP_LAYOUTS } = await import(new URL('../../../src/world/maps.js', import.meta.url));
const { layoutFor } = await import(new URL('../../../src/world/variants.js', import.meta.url));
const D = await import(new URL('../../../src/world/eras-data.js', import.meta.url));

const out = [];
const R = (name, ok, info) => { out.push({ name, ok: !!ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info === undefined ? '' : '\n      ' + JSON.stringify(info)}`); };
const L = layoutFor(MAP_LAYOUTS.bluestone, 'turf');
// every objective / water / reach / rail problem of a layout, over all its mode builds and eras
const problems = (lay) => {
  const ps = [], info = {};
  for (const [m, v] of D.eraBuilds(lay, 'turf')) {
    const oc = D.objectiveCheck(lay, v, m);
    ps.push(...oc.problems);
    for (const [k, x] of Object.entries(oc.info)) if (!(k in info) || (k === 'reach' ? x.d > info[k].d : x.d < info[k].d)) info[k] = { ...x, mode: m };
    for (const e of [1, 2, 3]) ps.push(...D.railCheck(v, e, m).problems);
  }
  return { ps, info };
};
// the layout with one more single piece in every build (the turf lists and the era source lists the other modes use)
const plant = (d) => ({ ...L, single: [...L.single, d], eras: { ...L.eras, source: { single: [...L.eras.source.single, d], half: L.eras.source.half } } });
const box = (x0, x1, y0, y1, z0, z1, o = {}) => ({ kind: 'box', min: [x0, y0, z0], max: [x1, y1, z1], color: '#888888', eras: '2', eraGroup: 'planted', tag: 'planted', ...o });

// ---------------------------------------------------------------------------------------------- the stage as built
const real = problems(L);
R('the stage as built: no objective, waterline, reach or river-rail problem in any mode build (turf, tower, bazookarp, boss, zones) or era',
  real.ps.length === 0, { problems: real.ps.slice(0, 6), nearest: real.info });
R('the nearest era piece to each objective, as the review measured it: a pad 15.9 m (rule ≥ 12), a zone 3.5 m (≥ 2), a weir 4.5 m from its centre (≥ 3), the tower\'s swept volume ≥ 1 m, the reach ≤ 85 m',
  real.info.spawn.d >= 12 && Math.abs(real.info.spawn.d - 15.92) < 0.05 && Math.abs(real.info.zone.d - 3.5) < 0.05 && Math.abs(real.info.karp.d - 4.5) < 0.05 && real.info.tower.d >= 1 && real.info.reach.d <= 85,
  real.info);
// the river rails: the check sees them (each era)
const rails = [1, 2, 3].map((e) => D.railCheck(D.eraPieces(L), e, 'turf').rails);
R('the river rails are found in every era (a rail with open water along one long side)', rails.every((n) => n >= 10), { rails });

// ---------------------------------------------------------------------------------------------- planted violations
const PAD = L.spawnPads[0], W = L.bazookarp.weirs[0].at, side = L.zones.side.poly;
const cases = [
  ['rule 14 (12 m of a spawn pad): an era-2 crate 10 m in front of Alpha\'s pad', box(PAD[0] - 0.5, PAD[0] + 0.5, 1.0, 2.0, PAD[2] + 10, PAD[2] + 11), /rule 14/],
  ['rule 15 (2 m of a zone, any height): an era-3 roof box 1.5 m beside the side zone, 4 m up', box(-20 + 1.5, -20 + 2.5, 4.0, 5.0, -20, -19, { eras: '3' }), /rule 15/],
  ['rule 16 (the tower\'s swept platform + headroom): an era-2 box across the tower track on Swimston\'s east track', box(19, 20, 0, 1.0, 30, 31), /rule 16/],
  ['rule 17 (3 m of a weir): an era-2 box 2 m from Bravo\'s weir', box(W[0] + 2, W[0] + 3, W[1], W[1] + 1, W[2] - 0.5, W[2] + 0.5), /rule 17/],
  ['rule 36 (an era-only waterline deck slab): an era-2 deck in the river, top 0, bottom −1.5', box(-2, 2, -1.5, 0, -42, -38), /rule 36/],
  ['rule 37 (the reach ≤ 85 m): an era-2 box 86 m from Tartar', box(-1, 1, 0, 1, -86.5, -85.5), /rule 37/],
];
for (const [name, d, re] of cases) {
  const p = problems(plant(d));
  R(`planted, ${name}: check-maps fails with that rule`, p.ps.some((s) => re.test(s)), { hits: p.ps.filter((s) => re.test(s)).slice(0, 2), other: p.ps.filter((s) => !re.test(s)).length });
}
// a river rail cut short: the longest box rail bordering water loses 1.5 m at one end, leaving the water's edge open
{
  const pcs = D.eraPieces(L), names = new Set(D.railCheck(pcs, 1, 'turf').list);
  const cand = L.half.map((d, i) => ({ d, i })).filter(({ d, i }) => d.kind === 'box' && d.rail && names.has(`half[${i}]`))
    .map((c) => ({ ...c, len: Math.max(c.d.max[0] - c.d.min[0], c.d.max[2] - c.d.min[2]) })).sort((a, b) => b.len - a.len);
  let hit = null;
  for (const c of cand.slice(0, 6)) {
    const ax = c.d.max[0] - c.d.min[0] >= c.d.max[2] - c.d.min[2] ? 0 : 2;
    for (const end of ['min', 'max']) {
      const d2 = { ...c.d, min: [...c.d.min], max: [...c.d.max] };
      if (end === 'min') d2.min[ax] += 1.5; else d2.max[ax] -= 1.5;
      const swap = (list) => list.map((x) => (x === c.d ? d2 : x));
      const lay = { ...L, half: swap(L.half), eras: { ...L.eras, source: { single: L.eras.source.single, half: swap(L.eras.source.half) } } };
      const ps = problems(lay).ps.filter((s) => /a river rail ends on land/.test(s));
      if (ps.length) { hit = { rail: `half[${c.i}] ${c.d.tag || ''}`, cut: `${end} ${'xyz'[ax]} 1.5 m`, problem: ps[0] }; break; }
    }
    if (hit) break;
  }
  R('planted, the river rails (T2: a rail that borders water ends on land or on another rail): one cut 1.5 m short, check-maps fails', !!hit, hit || { tried: cand.slice(0, 6).map((c) => c.i) });
}
// the turf rules on the stage's own numbers (eras-world part 2 measures them on the live paint grid) and planted ones
{
  const ok = D.turfRules([10000, 10270, 12100], { '1>2': 0, '2>3': 0 });
  const bad = [
    ['rule 11', D.turfRules([10000, 11200, 12100], {}), /rule 11/],
    ['rule 12 (takes away)', D.turfRules([10000, 10270, 10000], {}), /rule 12/],
    ['rule 12 (over +25 %)', D.turfRules([10000, 10270, 13000], {}), /rule 12/],
    ['rule 13', D.turfRules([10000, 10270, 12100], { '1>2': 900 }), /rule 13/],
  ];
  R('the turf rules (11–13): in-range numbers pass; era 2 +12 %, era 3 below era 2, era 3 +26.6 %, 9 % vanishing in one jump each fail with their rule',
    ok.length === 0 && bad.every(([, ps, re]) => ps.length === 1 && re.test(ps[0])), bad.map(([k, ps]) => [k, ps[0]]));
}
// the capacity rules (8, 9; review 2, issue 4): the review's measure of the union (12,312 m², 11.3 % era-only, 1,142 rows)
// passes; a union over 20,000 m², era-only over 25 %, 1,900 rows, and an atlas that does not fit each fail with their rule
{
  const ok = D.capacityRules({ area: 12312, eraOnly: 1391, rows: 1142, fits: true });
  const bad = [
    ['rule 8 (area)', D.capacityRules({ area: 20500, eraOnly: 1391, rows: 1142, fits: true }), /rule 8: ≤ 20,000/],
    ['rule 8 (era-only)', D.capacityRules({ area: 12312, eraOnly: 3200, rows: 1142, fits: true }), /rule 8: ≤ 25 %/],
    ['rule 9 (rows)', D.capacityRules({ area: 12312, eraOnly: 1391, rows: 1900, fits: true }), /rule 9/],
    ['rule 9 (no fit)', D.capacityRules({ area: 12312, eraOnly: 1391, rows: 2100, fits: false }), /does not fit/],
  ];
  R('the capacity rules (8, 9): the union as the review measured it passes; 20,500 m², 26 % era-only, 1,900 rows and an atlas that does not fit each fail with their rule',
    ok.length === 0 && bad.every(([, ps, re]) => ps.length === 1 && re.test(ps[0])), bad.map(([k, ps]) => [k, ps[0]]));
}
// ---------------------------------------------------------------------------------------------- 18, 21–23, 26, 29–30, 39
{
  const builds = (lay) => D.eraBuilds(lay, 'turf');
  const st = (lay) => {
    const ps = [], acc = [];
    for (const [m, v] of builds(lay)) {
      const o = D.overheadCheck(v, lay.eras.accept?.rule22 || []);
      ps.push(...[...D.tartarCheck(v), ...o.problems, ...D.deckEdgeCheck(v).problems, ...D.heightCheck(v).problems, ...D.swapCheck(v).problems].map((x) => `[${m}] ${x}`));
      acc.push(...o.info.accepted);
    }
    ps.push(...D.lookCheck(lay, builds(lay)).problems);
    return { ps, acc };
  };
  const real2 = st(L), tv = D.eraPieces(L);
  const oi = D.overheadCheck(tv, L.eras.accept?.rule22 || []).info, di = D.deckEdgeCheck(tv).info;
  R('the stage as built: Tartar\'s tower (18), the overhead pieces (21–22: the one accepted exception, printed), their deck edges (23), era-3 tops (26), swaps (29–30), the looks (39) — no problem in any mode build',
    real2.ps.length === 0 && oi.overheads >= 30 && di.decks >= 16 && real2.acc.length > 0 && real2.acc.every((a) => /halo-6/.test(a)),
    { problems: real2.ps.slice(0, 6), accepted: [...new Set(real2.acc)], overheads: oi, decks: di, height: D.heightCheck(tv).info, swaps: D.swapCheck(tv).info, looks: D.lookCheck(L, builds(L)).info });
  const plantN = (...ds) => ({ ...L, single: [...L.single, ...ds], eras: { ...L.eras, source: { single: [...L.eras.source.single, ...ds], half: L.eras.source.half } } });
  // (planted over Swimston's carriageway, x −24.5 … −16, a route; Tartar's concourse at (0, 0))
  const swapDome = (() => { const d0 = [...L.single, ...L.half].find((d) => d.tag === 'dome'); const sw = (list) => list.map((x) => (x === d0 ? { ...d0, eras: '12' } : x)); return { ...L, single: sw(L.single), half: sw(L.half), eras: { ...L.eras, source: { single: sw(L.eras.source.single), half: sw(L.eras.source.half) } } }; })();
  const cases2 = [
    ['rule 18 (Tartar\'s tower never changes): an era-2 box set on the concourse', plantN(box(-1, 1, 1.3, 2.3, -1, 1)), /rule 18/],
    ['rule 18: the dome given eras \'12\'', swapDome, /rule 18/],
    ['rule 22 (an overhead underside ≥ 4.0 m over a route): an era-3 deck 3.6 m over Swimston', plantN(box(-19, -17, 3.6, 3.8, -31, -29, { eras: '3' })), /rule 22: an overhead piece's underside/],
    ['rule 22 (an overhead deck ≤ 6 m wide): an era-3 deck 7 × 7 m, 4.4 m over Swimston', plantN(box(-24, -17, 4.4, 4.7, -36, -29, { eras: '3' })), /rule 22: ≤ 6 m/],
    ['rule 23 (an open overhead deck edge railed): an era-3 deck 3 × 5 m, 4.5 m over Swimston, no rails', plantN(box(-19.5, -16.5, 4.5, 4.8, -33, -28, { eras: '3' })), /rule 23/],
    ['rule 26 (era-3 walkable tops ≤ 9 m): an era-3 deck at 9.5 m', plantN(box(-19, -17, 9.2, 9.5, -31, -29, { eras: '3' })), /rule 26/],
    ['rule 29 (a swap\'s new footprint inside the old): an era-1 roofed crate 2 × 2 m and, in its group, an era-2–3 box 3 × 3 m', plantN(box(-19, -17, 0, 2.0, -31, -29, { eras: '1', roof: true, paint: false, eraGroup: 'planted-sw' }), box(-19.5, -16.5, 0, 1.0, -31.5, -28.5, { eras: '23', eraGroup: 'planted-sw' })), /rule 29/],
    ['rule 30 (swapped walkable tops ±0.02 m): an era-1 1.0 m top swapping with an era-2–3 1.1 m one', plantN(box(-19, -17, 0, 1.0, -31, -29, { eras: '1', eraGroup: 'planted-sw2' }), box(-19, -17, 0, 1.1, -31, -29, { eras: '23', eraGroup: 'planted-sw2' })), /rule 30/],
    ['rule 39 (≤ 4 remaps): five remap entries', { ...L, eras: { ...L.eras, remap: [...L.eras.remap, ...L.eras.remap, L.eras.remap[0]] } }, /remap entries \(rule 39/],
    ['rule 39 (≤ 6 stage texlib slots): four more stage slots on era-2 boxes', plantN(...[70, 71, 72, 73].map((k, i) => box(-19, -18.5, 0, 0.5, -31 + i, -30.5 + i, { pattern: k, eraGroup: 'planted-tex' }))), /texlib slots of its own/],
  ];
  for (const [name, lay, re] of cases2) {
    const p2 = st(lay).ps;
    R(`planted, ${name}: check-maps fails with that rule`, p2.some((x) => re.test(x)), { hits: p2.filter((x) => re.test(x)).slice(0, 2), other: p2.filter((x) => !re.test(x)).length });
  }
}

const fails = out.filter((x) => !x.ok).length;
console.log(`RESULT eras-static ${out.length - fails}/${out.length}`);
process.exit(fails ? 1 : 0);
